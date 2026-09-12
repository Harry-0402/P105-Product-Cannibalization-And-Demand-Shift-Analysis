/* ═══════════════════════════════════════════════════════════════════════
   P105 PowerBI VertiPaq-Style Web Worker Background Processing Engine
   ═══════════════════════════════════════════════════════════════════════ */

self.onmessage = function(e) {
    const { action, payload } = e.data;

    if (action === 'PROCESS_ANALYTICS') {
        const { prods, filters, D } = payload;
        
        const startTime = performance.now();

        // 1. Calculate Monthly Trend Vector in Background Thread
        const trendData = computeMonthlyTrend(prods, filters, D);

        // 2. Calculate Regional Share Matrix in Background Thread
        const regData = computeRegionShare(prods, filters);

        // 3. Calculate Price Band Distributions in Background Thread
        const pBandData = computePriceBands(prods, filters);

        // 4. Perform Background Anomaly & Statistical Variance Detection
        const anomalies = detectAnomalies(prods);

        const endTime = performance.now();
        const duration = Number((endTime - startTime).toFixed(2));

        // Post computed data back to main UI thread
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

function computeMonthlyTrend(prods, filters, D) {
    const months = D.monthly_trends.months;
    const globalSales = D.monthly_trends.sales;
    
    const sumBeforeGlobal = globalSales.slice(0, 17).reduce((a, b) => a + b, 0) || 1;
    const sumAfterGlobal = globalSales.slice(17, 24).reduce((a, b) => a + b, 0) || 1;

    const weightsBefore = globalSales.slice(0, 17).map(v => v / sumBeforeGlobal);
    const weightsAfter = globalSales.slice(17, 24).map(v => v / sumAfterGlobal);

    const monthlySales = new Array(24).fill(0);
    const monthlyRevenue = new Array(24).fill(0);

    const timelineP6 = D.cannibalization?.timeline?.P6?.sales || [];
    const timelineP4 = D.cannibalization?.timeline?.P4?.sales || [];
    const timelineP5 = D.cannibalization?.timeline?.P5?.sales || [];

    prods.forEach(p => {
        const pid = p.Product_ID;
        const price = p.avg_price || 100;

        for (let i = 0; i < 24; i++) {
            let mSales = 0;
            if (pid === 'P6' && timelineP6.length === 24) {
                mSales = timelineP6[i];
            } else if (pid === 'P4' && i >= 17 && timelineP4.length === 7) {
                mSales = timelineP4[i - 17];
            } else if (pid === 'P5' && i >= 17 && timelineP5.length === 7) {
                mSales = timelineP5[i - 17];
            } else if (i < 17) {
                if (p.is_launched) {
                    mSales = 0;
                } else {
                    const totalBeforeSales = (p.sales_before || p.avg_before || 25) * 17;
                    mSales = totalBeforeSales * weightsBefore[i];
                }
            } else {
                const totalAfterSales = (p.sales_after || p.avg_after || 25) * 7;
                mSales = totalAfterSales * weightsAfter[i - 17];
            }

            monthlySales[i] += mSales;
            monthlyRevenue[i] += mSales * price;
        }
    });

    let scaleOther = 1;
    if (filters.region && filters.region !== 'All') {
        const rData = D.regions.find(r => r.Region === filters.region);
        if (rData) scaleOther *= (rData.total_sales / D.kpis.total_sales);
    }
    if (filters.segment && filters.segment !== 'All') {
        scaleOther *= (filters.segment === 'High Value' ? 0.4 : (filters.segment === 'Mid Value' ? 0.35 : 0.25));
    }
    if (filters.price && filters.price !== 'All') {
        scaleOther *= (filters.price === 'Low' ? 0.2 : (filters.price === 'Medium' ? 0.5 : 0.3));
    }

    const scaledSales = monthlySales.map(s => Math.round(s * scaleOther));
    const scaledRevenue = monthlyRevenue.map(r => Math.round(r * scaleOther));

    return {
        months,
        sales: scaledSales,
        revenue: scaledRevenue
    };
}

function computeRegionShare(prods, filters) {
    let scaleOther = 1;
    const prodRegionMap = {
        'P1':  { East: 0.55, North: 0.25, South: 0.12, West: 0.08 },
        'P2':  { West: 0.48, South: 0.30, North: 0.14, East: 0.08 },
        'P3':  { South: 0.50, North: 0.28, West: 0.14, East: 0.08 },
        'P4':  { West: 0.52, South: 0.28, North: 0.12, East: 0.08 },
        'P5':  { West: 0.46, South: 0.32, North: 0.14, East: 0.08 },
        'P6':  { North: 0.48, East: 0.32, South: 0.12, West: 0.08 },
        'P7':  { South: 0.42, North: 0.32, West: 0.16, East: 0.10 },
        'P8':  { South: 0.44, North: 0.30, West: 0.16, East: 0.10 },
        'P9':  { South: 0.45, North: 0.29, West: 0.16, East: 0.10 },
        'P10': { West: 0.40, South: 0.32, North: 0.16, East: 0.12 },
        'P11': { East: 0.60, North: 0.20, West: 0.12, South: 0.08 },
        'P12': { South: 0.38, North: 0.32, West: 0.18, East: 0.12 },
        'P13': { West: 0.42, South: 0.30, North: 0.16, East: 0.12 },
        'P14': { North: 0.40, East: 0.30, South: 0.18, West: 0.12 },
        'P15': { East: 0.50, West: 0.24, North: 0.16, South: 0.10 },
        'P16': { North: 0.42, East: 0.28, South: 0.18, West: 0.12 },
        'P17': { East: 0.48, West: 0.26, North: 0.16, South: 0.10 },
        'P18': { West: 0.44, South: 0.28, North: 0.16, East: 0.12 },
        'P19': { West: 0.38, North: 0.32, East: 0.18, South: 0.12 },
        'P20': { East: 0.52, West: 0.24, North: 0.14, South: 0.10 },
        'P21': { North: 0.44, East: 0.26, South: 0.18, West: 0.12 },
        'P22': { West: 0.45, South: 0.29, North: 0.16, East: 0.10 },
        'P23': { East: 0.56, West: 0.22, North: 0.14, South: 0.08 },
        'P24': { West: 0.36, North: 0.32, East: 0.18, South: 0.14 },
        'P25': { West: 0.35, North: 0.31, East: 0.20, South: 0.14 },
    };

    const catSharesDefault = {
        'Household':     { East: 0.52, West: 0.24, North: 0.14, South: 0.10 },
        'Personal Care': { South: 0.42, North: 0.31, West: 0.16, East: 0.11 },
        'Beverages':     { North: 0.44, East: 0.28, South: 0.16, West: 0.12 },
        'Dairy':         { West: 0.46, South: 0.30, North: 0.14, East: 0.10 },
        'Snacks':        { West: 0.36, North: 0.31, East: 0.19, South: 0.14 },
    };

    const regions = ['East', 'North', 'South', 'West'];
    const regionSalesMap = { East: 0, North: 0, South: 0, West: 0 };
    const regionRevMap = { East: 0, North: 0, South: 0, West: 0 };

    prods.forEach(p => {
        const shares = prodRegionMap[p.Product_ID] || catSharesDefault[p.category] || { East: 0.25, North: 0.25, South: 0.25, West: 0.25 };
        regions.forEach(r => {
            regionSalesMap[r] += p.total_sales * shares[r] * scaleOther;
            regionRevMap[r] += p.total_revenue * shares[r] * scaleOther;
        });
    });

    if (filters.region && filters.region !== 'All') {
        regions.forEach(r => {
            if (r !== filters.region) {
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
        let matching = prods.filter(p => p.avg_price > b.min && p.avg_price <= b.max);
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
