/* ═══════════════════════════════════════════════════════════════════════
   P105 PowerBI VertiPaq-Style Web Worker Background Processing Engine
   ═══════════════════════════════════════════════════════════════════════ */

self.onmessage = function(e) {
    const { action, payload } = e.data;

    if (action === 'PROCESS_ANALYTICS') {
        const { prods, filters, D } = payload;

        const startTime = performance.now();

        const trendData = computeMonthlyTrend(prods, filters, D);
        const regData = computeRegionShare(prods, filters, D);
        const pBandData = computePriceBands(prods, filters);
        const anomalies = detectAnomalies(prods);

        const endTime = performance.now();
        const duration = Number((endTime - startTime).toFixed(2));

        self.postMessage({
            status: 'COMPLETED',
            durationMs: duration,
            trendData,
            regData,
            pBandData,
            anomalies,
            processedRecords: prods.reduce((s, p) => s + p.total_sales, 0)
        });
    }
};

function getSegmentScale(segments) {
    if (!segments || !segments.length || segments.includes('All')) return 1;
    const weights = { 'High Value': 0.4, 'Mid Value': 0.35, 'Budget': 0.25 };
    return segments.reduce((sum, s) => sum + (weights[s] || 0), 0) || 1;
}

function computeMonthlyTrend(prods, filters, D) {
    const months = D.monthly_trends.months;
    const monthlySales = new Array(months.length).fill(0);
    const monthlyRevenue = new Array(months.length).fill(0);

    prods.forEach(p => {
        const pm = D.monthly_by_product && D.monthly_by_product[p.Product_ID];
        if (pm && pm.sales && pm.revenue) {
            for (let i = 0; i < months.length; i++) {
                monthlySales[i] += pm.sales[i] || 0;
                monthlyRevenue[i] += pm.revenue[i] || 0;
            }
        }
    });

    let scaleOther = getSegmentScale(filters.segments || (filters.region ? [filters.segment] : ['All']));
    const selectedRegions = filters.regions && filters.regions.length && !filters.regions.includes('All')
        ? filters.regions
        : (filters.region && filters.region !== 'All' ? [filters.region] : null);

    if (selectedRegions && D.region_by_product) {
        let fullSales = 0;
        let regSales = 0;
        prods.forEach(p => {
            fullSales += p.total_sales || 0;
            const rp = D.region_by_product[p.Product_ID];
            if (rp) {
                selectedRegions.forEach(r => {
                    regSales += (rp[r]?.sales || 0);
                });
            }
        });
        if (fullSales > 0) scaleOther *= (regSales / fullSales);
    }

    return {
        months,
        sales: monthlySales.map(s => Math.round(s * scaleOther)),
        revenue: monthlyRevenue.map(r => Math.round(r * scaleOther))
    };
}

function computeRegionShare(prods, filters, D) {
    const regions = ['East', 'North', 'South', 'West'];
    const regionSalesMap = { East: 0, North: 0, South: 0, West: 0 };
    const regionRevMap = { East: 0, North: 0, South: 0, West: 0 };
    const scaleOther = getSegmentScale(filters.segments || (filters.segment ? [filters.segment] : ['All']));

    prods.forEach(p => {
        const rp = D.region_by_product && D.region_by_product[p.Product_ID];
        regions.forEach(r => {
            if (rp && rp[r]) {
                regionSalesMap[r] += rp[r].sales * scaleOther;
                regionRevMap[r] += rp[r].revenue * scaleOther;
            }
        });
    });

    const selectedRegions = filters.regions && filters.regions.length && !filters.regions.includes('All')
        ? filters.regions
        : (filters.region && filters.region !== 'All' ? [filters.region] : null);

    if (selectedRegions) {
        regions.forEach(r => {
            if (!selectedRegions.includes(r)) {
                regionSalesMap[r] = 0;
                regionRevMap[r] = 0;
            }
        });
    }

    return {
        regions,
        sales: regions.map(r => Math.round(regionSalesMap[r])),
        revenue: regions.map(r => Math.round(regionRevMap[r]))
    };
}

function computePriceBands(prods, filters) {
    const bandsDef = [
        { band: 'Budget (0-50)',     min: 0,   max: 50 },
        { band: 'Mid (51-100)',      min: 50,  max: 100 },
        { band: 'Premium (101-200)', min: 100, max: 200 },
        { band: 'Luxury (201+)',     min: 200, max: 9999 }
    ];

    const labels = bandsDef.map(b => b.band);
    const avgSalesArr = [];
    const revenueArr = [];

    bandsDef.forEach(b => {
        const matching = prods.filter(p => p.avg_price > b.min && p.avg_price <= b.max);
        const totalRev = matching.reduce((sum, p) => sum + p.total_revenue, 0);
        const totalSales = matching.reduce((sum, p) => sum + p.total_sales, 0);
        const avgSales = matching.length ? (totalSales / matching.length) / 24 : 0;

        revenueArr.push(Math.round(totalRev));
        avgSalesArr.push(Number(avgSales.toFixed(2)));
    });

    return { labels, revenue: revenueArr, avgSales: avgSalesArr };
}

function detectAnomalies(prods) {
    const anomalies = [];
    prods.forEach(p => {
        if (p.growth_pct < -20) {
            anomalies.push({ type: 'CRITICAL_DROP', product: p.Product_ID, dropPct: p.growth_pct });
        } else if (p.growth_pct > 20) {
            anomalies.push({ type: 'HIGH_GROWTH', product: p.Product_ID, growthPct: p.growth_pct });
        }
    });
    return anomalies;
}
