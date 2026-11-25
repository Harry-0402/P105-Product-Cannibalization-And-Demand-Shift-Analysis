
function createChart(id, ctx, config) {
    if (!ctx) return null;
    if (typeof charts !== 'undefined' && charts[id]) {
        try { charts[id].destroy(); } catch (e) {}
        delete charts[id];
    }
    if (window.Chart && typeof window.Chart.getChart === 'function') {
        const canvas = ctx.canvas || (typeof ctx === 'string' ? document.getElementById(ctx) : null);
        if (canvas) {
            const existing = window.Chart.getChart(canvas);
            if (existing) {
                try { existing.destroy(); } catch (e) {}
            }
        }
    }
    try {
        const instance = new Chart(ctx, config);
        if (typeof charts !== 'undefined') {
            charts[id] = instance;
        }
        return instance;
    } catch (err) {
        console.error(`Error rendering chart [${id}]:`, err);
        return null;
    }
}


// Global Safe Chart Registry
const activeCharts = {};

function createOrUpdateChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    if (activeCharts[canvasId]) {
        try { activeCharts[canvasId].destroy(); } catch (e) {}
        delete activeCharts[canvasId];
    }
    
    if (window.Chart && typeof window.Chart.getChart === 'function') {
        const existing = window.Chart.getChart(canvas);
        if (existing) {
            try { existing.destroy(); } catch (e) {}
        }
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    try {
        const newChart = new Chart(ctx, config);
        activeCharts[canvasId] = newChart;
        return newChart;
    } catch (err) {
        console.error(`Error creating chart on #${canvasId}:`, err);
        return null;
    }
}

function safeAddListener(target, event, handler) {
    if (!target) return;
    if (typeof target === 'string') {
        const el = document.getElementById(target);
        if (el) el.addEventListener(event, handler);
    } else if (target.addEventListener) {
        target.addEventListener(event, handler);
    } else if (target.length) {
        target.forEach(el => {
            if (el && el.addEventListener) el.addEventListener(event, handler);
        });
    }
}


const PAGE_TITLES_MAP = {
    executive: { title: 'Executive Overview', subtitle: 'Product Cannibalization & Demand Shift Analysis' },
    sales: { title: 'Sales Performance', subtitle: 'Monthly sales trends and before/after comparison' },
    products: { title: 'Product Performance', subtitle: 'Rankings, growth analysis, and revenue contribution' },
    cannibalization: { title: 'Cannibalization Analysis', subtitle: 'Demand shifts, P6 volume loss, and customer migration' },
    customers: { title: 'Customer Insights', subtitle: 'Customer retention, switching behavior, and regional breakdown' },
    pricing: { title: 'Pricing Analysis', subtitle: 'Price elasticity, price band distribution, and revenue impact' },
    marketing: { title: 'Marketing Analysis', subtitle: 'Campaign ROI, marketing spend efficiency, and conversion' },
    inventory: { title: 'Inventory Analysis', subtitle: 'Stock availability, out-of-stock records, and supply chain' },
    regional: { title: 'Regional Analysis', subtitle: 'Geographic revenue breakdown and regional growth' },
    recommendations: { title: 'Strategic Recommendations', subtitle: 'Actionable insights and optimization strategies' },
    creator: { title: 'Creator Profile', subtitle: 'About the author and project portfolio' }
};

function updateFilterHubPageHeader(pageId) {
    const info = PAGE_TITLES_MAP[pageId] || PAGE_TITLES_MAP.executive;
    const tEl = document.getElementById('filter-hub-page-title');
    const sEl = document.getElementById('filter-hub-page-subtitle');
    if (tEl) tEl.textContent = info.title;
    if (sEl) sEl.textContent = info.subtitle;
}

function switchTab(page) {
    if (!page) return;
    window.currentPage = page;
    document.querySelectorAll('.nav-link').forEach(l => {
        if (l.dataset.page === page) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.add('active');

    document.body.classList.toggle('page-no-controls', page === 'creator' || page === 'recommendations');
    const creatorBtn = document.getElementById('sidebarCreatorBtn');
    if (creatorBtn) creatorBtn.classList.toggle('is-active-page', page === 'creator');
    window.__activeDockBtnId = (page === 'creator') ? 'sidebarCreatorBtn' : 'themeToggle';
    setDockFocus(window.__activeDockBtnId);

    updateFilterHubPageHeader(page);
    renderPage(page);
    if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
    }
}


function formatSetLabel(setObj) {
    if (!setObj || setObj.has('All') || setObj.size === 0) return null;
    const arr = Array.from(setObj);
    return arr.length <= 2 ? arr.join(', ') : `${arr.slice(0, 2).join(', ')} (+${arr.length - 2})`;
}

function updateChartTitles(scope) {
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    const catLabel = formatSetLabel(window.multiSelectState?.['filter-category']);
    const prodLabel = formatSetLabel(window.multiSelectState?.['filter-product']);
    const regLabel = formatSetLabel(window.multiSelectState?.['filter-region']);
    const priceLabel = formatSetLabel(window.multiSelectState?.['filter-price']);

    if (catLabel) {
        setText('title-exec-category', `Sales by Product (${catLabel})`);
        setText('title-sales-cat-ba', `Sales by Product — Before vs After (${catLabel})`);
    } else if (prodLabel) {
        setText('title-exec-category', `Sales for Selected Product (${prodLabel})`);
        setText('title-sales-cat-ba', `Sales — Before vs After (${prodLabel})`);
    } else {
        setText('title-exec-category', 'Sales by Category');
        setText('title-sales-cat-ba', 'Sales by Category — Before vs After Launch');
    }

    if (regLabel) {
        setText('title-exec-region', `Sales by Category (${regLabel})`);
        setText('title-sales-reg-ba', `Sales by Category — Before vs After (${regLabel})`);
        setText('title-cust-region', `Customers by Category (${regLabel})`);
        setText('title-reg-revenue', `Revenue by Category (${regLabel})`);
        setText('title-reg-ba', `Sales — Before vs After (${regLabel})`);
    } else {
        setText('title-exec-region', 'Sales by Region');
        setText('title-sales-reg-ba', 'Sales by Region — Before vs After Launch');
        setText('title-cust-region', 'Customers by Region');
        setText('title-reg-revenue', 'Revenue by Region');
        setText('title-reg-ba', 'Sales — Before vs After by Region');
    }

    if (priceLabel) {
        setText('title-price-band', `Sales by Product (${priceLabel})`);
        setText('title-price-revenue', `Revenue by Product (${priceLabel})`);
    } else {
        setText('title-price-band', 'Sales by Price Band');
        setText('title-price-revenue', 'Revenue by Price Band');
    }
}

/* ═══════════════════════════════════════════════════════════════════════
   P105 — Product Cannibalization Dashboard — Application Logic
   ═══════════════════════════════════════════════════════════════════════ */

const D = DASHBOARD_DATA;
const charts = {};

// ── Chart.js Global Config ──────────────────────────────────────────

Chart.defaults.color = '#cbd5e1';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
Chart.defaults.plugins.legend.labels.padding = 20;
Chart.defaults.plugins.legend.labels.boxPadding = 8;
Chart.defaults.animation.duration = 800;

Chart.defaults.font.family = "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif";

Chart.defaults.plugins.tooltip = {
    enabled: true,
    mode: 'index',
    intersect: false,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    titleColor: '#f8fafc',
    bodyColor: '#e2e8f0',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    borderWidth: 1.5,
    padding: 14,
    cornerRadius: 10,
    boxPadding: 8,
    usePointStyle: true,
    titleFont: { family: "'Plus Jakarta Sans', sans-serif", weight: '700', size: 12.5 },
    bodyFont: { family: "'Plus Jakarta Sans', sans-serif", weight: '500', size: 12 },
    footerFont: { family: "'Plus Jakarta Sans', sans-serif", weight: '600', size: 11 },
    footerColor: '#818cf8',
    footerMarginTop: 8,
    callbacks: {
        title: function(tooltipItems) {
            if (!tooltipItems.length) return '';
            const item = tooltipItems[0];
            const label = item.label || item.xLabel || '';
            return `📅 Period / Dimension: ${label}`;
        },
        label: function(context) {
            const datasetLabel = context.dataset.label || '';
            const value = context.raw;
            if (value === null || value === undefined) return '';

            let formattedVal = '';
            if (typeof value === 'number') {
                const labelText = (datasetLabel || '').toLowerCase();
                const xLabel = (context.chart.data.labels[context.dataIndex] || '').toString().toLowerCase();

                if (labelText.includes('revenue') || xLabel.includes('revenue')) {
                    formattedVal = '₹' + fmtFull(Math.round(value));
                } else if (context.chart.config.type === 'doughnut' || context.chart.config.type === 'pie') {
                    const dataArr = context.dataset.data;
                    const total = dataArr.reduce((a, b) => a + (b || 0), 0);
                    const pct = total ? ((value / total) * 100).toFixed(1) : '0.0';
                    formattedVal = `${fmtFull(Math.round(value))} units (${pct}% share)`;
                } else if (labelText.includes('%') || labelText.includes('rate') || labelText.includes('roi')) {
                    formattedVal = value.toFixed(1) + (labelText.includes('roi') ? 'x' : '%');
                } else {
                    formattedVal = `${fmtFull(Math.round(value))} units`;
                }
            } else {
                formattedVal = value;
            }

            return ` 📊 ${datasetLabel || 'Value'}: ${formattedVal}`;
        },
        footer: function(tooltipItems) {
            const activeProds = window.filteredProducts || D.products;
            if (activeProds.length < D.products.length) {
                if (activeProds.length === 1) {
                    return `🔍 Filter Scope: Product ${activeProds[0].Product_ID} (${activeProds[0].category})`;
                }
                return `🔍 Filter Scope: ${activeProds.length} Products Selected`;
            }
            return `⚡ Filter Scope: Full Portfolio Dataset`;
        }
    }
};

if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
    Chart.defaults.plugins.datalabels = {
        color: '#ffffff',
        font: { weight: '600', size: 11 },
        display: function(context) {
            return context.chart.config.type === 'doughnut' || context.chart.config.type === 'pie';
        },
        formatter: (value, context) => {
            const dataArr = context.chart.data.datasets[0].data;
            const sum = dataArr.reduce((a, b) => a + b, 0);
            if (sum === 0 || value === 0) return '';
            return (value * 100 / sum).toFixed(1) + '%';
        }
    };
}

const COLORS = {
    blue:   '#6366f1',  teal:   '#14b8a6',  amber:  '#f59e0b',
    red:    '#ef4444',  green:  '#22c55e',  purple: '#a855f7',
    pink:   '#ec4899',  cyan:   '#06b6d4',  orange: '#f97316',
    blueBg: 'rgba(99,102,241,0.15)', tealBg: 'rgba(20,184,166,0.15)',
    redBg:  'rgba(239,68,68,0.15)',  greenBg:'rgba(34,197,94,0.15)',
};

const PALETTE = [COLORS.blue, COLORS.teal, COLORS.amber, COLORS.red, COLORS.green,
                 COLORS.purple, COLORS.pink, COLORS.cyan, COLORS.orange];

// ── Utility Functions ───────────────────────────────────────────────

function fmt(n, decimals = 0) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toFixed(decimals);
}

function fmtFull(n) { return n.toLocaleString('en-IN'); }

const SPARKLINE_CONFIGS = {
    'TOTAL SALES':          { isUp: true,  points: [16, 12, 14, 8, 10, 4, 6, 2] },
    'TOTAL REVENUE':        { isUp: true,  points: [17, 14, 15, 9, 11, 5, 7, 3] },
    'AVG PRICE':            { isUp: true,  points: [12, 11, 11, 10, 9, 8, 8, 7] },
    'CANNIBALIZATION RATE': { isUp: false, points: [4, 6, 5, 10, 9, 14, 13, 17] },
    'CUSTOMER RETENTION':   { isUp: true,  points: [14, 12, 11, 9, 10, 6, 5, 3] },
    'AVG RATING':           { isUp: true,  points: [11, 10, 10, 8, 7, 5, 4, 3] },
    'MARKETING ROI':        { isUp: true,  points: [15, 13, 12, 9, 8, 6, 4, 2] },
    'STOCK AVAILABILITY':   { isUp: true,  points: [10, 8, 10, 7, 8, 5, 4, 3] },
};

function generateSparklineSVG(label, changeClass, color) {
    const labelKey = (label || '').toUpperCase().trim();
    const config = SPARKLINE_CONFIGS[labelKey] || { 
        isUp: changeClass !== 'negative' && color !== 'red', 
        points: [15, 12, 13, 9, 10, 6, 5, 2] 
    };
    
    const strokeColor = config.isUp ? '#10b981' : '#ef4444';
    const gradId = `sparkGrad_${labelKey.replace(/[^A-Z]/g, '') || 'DEFAULT'}`;
    
    const pts = config.points;
    const xCoords = [0, 8, 16, 24, 32, 40, 48, 54];
    
    let pathD = `M ${xCoords[0]},${pts[0]}`;
    for (let i = 1; i < xCoords.length; i++) {
        const xc = (xCoords[i - 1] + xCoords[i]) / 2;
        pathD += ` C ${xc},${pts[i - 1]} ${xc},${pts[i]} ${xCoords[i]},${pts[i]}`;
    }
    
    const areaD = `${pathD} L 54,20 L 0,20 Z`;

    return `
        <svg width="54" height="20" viewBox="0 0 54 20" fill="none" class="kpi-spark-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0"/>
                </linearGradient>
            </defs>
            <path class="spark-area" d="${areaD}" fill="url(#${gradId})" stroke="none" style="stroke:none !important;" />
            <path class="spark-line" d="${pathD}" stroke="${strokeColor}" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" fill="none" style="fill:none !important; stroke:${strokeColor} !important;" />
        </svg>
    `;
}

function createKPI(label, value, change, color, changeLabel, iconName = 'shopping-cart', subtextOverride = null) {
    const card = document.createElement('div');
    card.className = `kpi-card ${color || 'blue'}`;
    const changeClass = typeof change === 'number' ? (change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral') : 'neutral';
    
    let changeText = '';
    if (subtextOverride) {
        changeText = subtextOverride;
    } else if (typeof change === 'number') {
        const sign = change > 0 ? '↑ +' : change < 0 ? '↓ ' : '';
        changeText = `${sign}${change.toFixed(1)}% ${changeLabel || 'growth'}`;
    } else if (change) {
        changeText = change;
    } else {
        changeText = 'Portfolio metric';
    }

    // Map icon to shopping-cart for sales
    let targetIcon = iconName;
    if (label.toLowerCase().includes('sales')) targetIcon = 'shopping-cart';

    const sparklineSVG = generateSparklineSVG(label, changeClass, color);

    card.innerHTML = `
        <div class="kpi-left-icon-box ${color || 'blue'}">
            <i data-lucide="${targetIcon}"></i>
        </div>
        <div class="kpi-right-content-col">
            <div class="kpi-title-text" title="${label}">${label}</div>
            <div class="kpi-value-text">${value}</div>
            <div class="kpi-footer-flex">
                <span class="kpi-growth-text ${changeClass}">${changeText}</span>
                <div class="kpi-sparkline-box">
                    ${sparklineSVG}
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        if (window.lucide && window.lucide.createIcons) {
            window.lucide.createIcons();
        }
    }, 10);

    return card;
}

function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function getCtx(id) {
    destroyChart(id);
    return document.getElementById(id)?.getContext('2d');
}

// ── Navigation ──────────────────────────────────────────────────────

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page) switchTab(page);
    });
});

const renderedPages = new Set();
function renderPage(page) {
    if (renderedPages.has(page)) return;
    renderedPages.add(page);
    const renderers = {
        executive: renderExecutive,
        sales: renderSales,
        products: renderProducts,
        cannibalization: renderCannibalization,
        customers: renderCustomers,
        pricing: renderPricing,
        marketing: renderMarketing,
        inventory: renderInventory,
        regional: renderRegional,
        recommendations: renderRecommendations,
    };
    if (renderers[page]) renderers[page]();
}


// ═══════════════════════════════════════════════════════════════════════

// ── Dynamic Data Aggregators for Filter Responsiveness ─────────────

function getMonthlyProductTrend(prods) {
    const months = D.monthly_trends.months; // 24 months
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
    if (window.filterRegion && window.filterRegion !== 'All') {
        const rData = D.regions.find(r => r.Region === window.filterRegion);
        if (rData) scaleOther *= (rData.total_sales / D.kpis.total_sales);
    }
    if (window.filterSegment && window.filterSegment !== 'All') {
        scaleOther *= (window.filterSegment === 'High Value' ? 0.4 : (window.filterSegment === 'Mid Value' ? 0.35 : 0.25));
    }
    if (window.filterPrice && window.filterPrice !== 'All') {
        scaleOther *= (window.filterPrice === 'Low' ? 0.2 : (window.filterPrice === 'Medium' ? 0.5 : 0.3));
    }

    const scaledSales = monthlySales.map(s => Math.round(s * scaleOther));
    const scaledRevenue = monthlyRevenue.map(r => Math.round(r * scaleOther));

    const dateFiltSales = applyDateFilter(months, scaledSales);
    const dateFiltRev = applyDateFilter(months, scaledRevenue);

    return {
        months: dateFiltSales.months,
        sales: dateFiltSales.data,
        revenue: dateFiltRev.data
    };
}

function getRegionDataForProducts(prods) {
    let scaleOther = 1;
    if (window.filterDate && window.filterDate !== 'All') {
        const dFilt = applyDateFilter(D.monthly_trends.months, D.monthly_trends.sales);
        const dateSales = dFilt.data.reduce((a, b) => a + b, 0);
        const allSales = D.monthly_trends.sales.reduce((a, b) => a + b, 0);
        scaleOther *= (dateSales / allSales) || 1;
    }
    if (window.filterSegment && window.filterSegment !== 'All') {
        scaleOther *= (window.filterSegment === 'High Value' ? 0.4 : (window.filterSegment === 'Mid Value' ? 0.35 : 0.25));
    }
    if (window.filterPrice && window.filterPrice !== 'All') {
        scaleOther *= (window.filterPrice === 'Low' ? 0.2 : (window.filterPrice === 'Medium' ? 0.5 : 0.3));
    }

    const catShares = {
        'Household':     { East: 0.265, North: 0.242, South: 0.248, West: 0.245 },
        'Personal Care': { East: 0.238, North: 0.261, South: 0.254, West: 0.247 },
        'Beverages':     { East: 0.241, North: 0.245, South: 0.262, West: 0.252 },
        'Dairy':         { East: 0.252, North: 0.248, South: 0.241, West: 0.259 },
        'Snacks':        { East: 0.246, North: 0.258, South: 0.245, West: 0.251 },
    };

    const regions = ['East', 'North', 'South', 'West'];
    const regionSalesMap = { East: 0, North: 0, South: 0, West: 0 };
    const regionRevMap = { East: 0, North: 0, South: 0, West: 0 };

    prods.forEach(p => {
        const shares = catShares[p.category] || { East: 0.25, North: 0.25, South: 0.25, West: 0.25 };
        regions.forEach(r => {
            regionSalesMap[r] += p.total_sales * shares[r] * scaleOther;
            regionRevMap[r] += p.total_revenue * shares[r] * scaleOther;
        });
    });

    if (window.filterRegion && window.filterRegion !== 'All') {
        regions.forEach(r => {
            if (r !== window.filterRegion) {
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

function getPriceBandDataForProducts(prods) {
    let scaleOther = 1;
    if (window.filterDate && window.filterDate !== 'All') {
        const dFilt = applyDateFilter(D.monthly_trends.months, D.monthly_trends.sales);
        const dateSales = dFilt.data.reduce((a, b) => a + b, 0);
        const allSales = D.monthly_trends.sales.reduce((a, b) => a + b, 0);
        scaleOther *= (dateSales / allSales) || 1;
    }
    if (window.filterRegion && window.filterRegion !== 'All') {
        const rData = D.regions.find(r => r.Region === window.filterRegion);
        if (rData) scaleOther *= (rData.total_sales / D.kpis.total_sales);
    }
    if (window.filterSegment && window.filterSegment !== 'All') {
        scaleOther *= (window.filterSegment === 'High Value' ? 0.4 : (window.filterSegment === 'Mid Value' ? 0.35 : 0.25));
    }

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
        if (window.filterPrice && window.filterPrice !== 'All') {
            if (window.filterPrice === 'Low' && b.band !== 'Budget (0-50)') matching = [];
            if (window.filterPrice === 'Medium' && !['Mid (51-100)', 'Premium (101-200)'].includes(b.band)) matching = [];
            if (window.filterPrice === 'High' && b.band !== 'Luxury (201+)') matching = [];
        }

        const totalRev = matching.reduce((sum, p) => sum + p.total_revenue, 0) * scaleOther;
        const totalSales = matching.reduce((sum, p) => sum + p.total_sales, 0) * scaleOther;
        const avgSales = matching.length ? (totalSales / matching.length) / 24 : 0;

        revenueArr.push(Math.round(totalRev));
        avgSalesArr.push(Number(avgSales.toFixed(2)));
    });

    return { labels, revenue: revenueArr, avgSales: avgSalesArr };
}



// ═══════════════════════════════════════════════════════════════════════
// UNIFIED DATA SELECTOR PIPELINE (ONE-STOP REAL-TIME FILTER ENGINE)
// ═══════════════════════════════════════════════════════════════════════

function getActiveFilterArray(id) {
    const s = window.multiSelectState && window.multiSelectState[id];
    if (!s || s.has('All') || s.size === 0) return null;
    return Array.from(s);
}

function getSegmentScale() {
    const segs = getActiveFilterArray('filter-segment');
    if (!segs) return 1;
    const weights = { 'High Value': 0.4, 'Mid Value': 0.35, 'Budget': 0.25 };
    return segs.reduce((sum, seg) => sum + (weights[seg] || 0), 0) || 1;
}

function getFilteredDatasetScope() {
    const prods = window.filteredProducts || D.products;
    const isFiltered = prods.length < D.products.length;
    const activeDates = getActiveFilterArray('filter-date');
    const activeRegions = getActiveFilterArray('filter-region');
    const activeSegs = getActiveFilterArray('filter-segment');
    const activePrices = getActiveFilterArray('filter-price');

    const segScale = getSegmentScale();
    const hasSecondaryFilter = !!(activeDates || activeRegions || activeSegs || activePrices);

    let regionRatio = 1;
    if (activeRegions && D.region_by_product) {
        let totalProdSales = 0;
        let selectedRegSales = 0;
        prods.forEach(p => {
            totalProdSales += p.total_sales || 0;
            const rp = D.region_by_product[p.Product_ID];
            if (rp) {
                activeRegions.forEach(r => {
                    selectedRegSales += (rp[r]?.sales || 0);
                });
            }
        });
        regionRatio = totalProdSales > 0 ? (selectedRegSales / totalProdSales) : 0;
    }

    const scaleOther = segScale * regionRatio;

    // 1. Exact Monthly Timeline from D.monthly_by_product
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

    const scaledSales = monthlySales.map(s => Math.round(s * scaleOther));
    const scaledRevenue = monthlyRevenue.map(r => Math.round(r * scaleOther));
    const dateFiltSales = applyDateFilter(months, scaledSales);
    const dateFiltRev = applyDateFilter(months, scaledRevenue);

    // 2. Exact Regional Matrix from D.region_by_product
    const allRegions = ['East', 'North', 'South', 'West'];
    let regLabels = allRegions;
    let regSales = [];
    let regRevenue = [];
    let regSalesBefore = [];
    let regSalesAfter = [];
    let regCustomers = [];

    if (activeRegions) {
        const uniqueCats = [...new Set(prods.map(p => p.category))];
        regLabels = uniqueCats;
        regSales = uniqueCats.map(cat => Math.round(
            prods.filter(p => p.category === cat).reduce((sum, p) => {
                const rp = D.region_by_product?.[p.Product_ID];
                const rSum = rp ? activeRegions.reduce((rs, r) => rs + (rp[r]?.sales || 0), 0) : 0;
                return sum + rSum * segScale;
            }, 0)
        ));
        regRevenue = uniqueCats.map(cat => Math.round(
            prods.filter(p => p.category === cat).reduce((sum, p) => {
                const rp = D.region_by_product?.[p.Product_ID];
                const rSum = rp ? activeRegions.reduce((rs, r) => rs + (rp[r]?.revenue || 0), 0) : 0;
                return sum + rSum * segScale;
            }, 0)
        ));
        regSalesBefore = uniqueCats.map(cat => Math.round(
            prods.filter(p => p.category === cat).reduce((sum, p) => {
                const rp = D.region_by_product?.[p.Product_ID];
                const rSum = rp ? activeRegions.reduce((rs, r) => rs + (rp[r]?.sales_before || 0), 0) : 0;
                return sum + rSum * segScale;
            }, 0)
        ));
        regSalesAfter = uniqueCats.map(cat => Math.round(
            prods.filter(p => p.category === cat).reduce((sum, p) => {
                const rp = D.region_by_product?.[p.Product_ID];
                const rSum = rp ? activeRegions.reduce((rs, r) => rs + (rp[r]?.sales_after || 0), 0) : 0;
                return sum + rSum * segScale;
            }, 0)
        ));
        regCustomers = uniqueCats.map(cat => Math.round(
            prods.filter(p => p.category === cat).reduce((sum, p) => {
                const rp = D.region_by_product?.[p.Product_ID];
                const rSum = rp ? activeRegions.reduce((rs, r) => rs + (rp[r]?.customers || 0), 0) : 0;
                return sum + rSum * segScale;
            }, 0)
        ));
    } else {
        regSales = allRegions.map(r => Math.round(
            prods.reduce((sum, p) => sum + ((D.region_by_product?.[p.Product_ID]?.[r]?.sales || 0) * segScale), 0)
        ));
        regRevenue = allRegions.map(r => Math.round(
            prods.reduce((sum, p) => sum + ((D.region_by_product?.[p.Product_ID]?.[r]?.revenue || 0) * segScale), 0)
        ));
        regSalesBefore = allRegions.map(r => Math.round(
            prods.reduce((sum, p) => sum + ((D.region_by_product?.[p.Product_ID]?.[r]?.sales_before || 0) * segScale), 0)
        ));
        regSalesAfter = allRegions.map(r => Math.round(
            prods.reduce((sum, p) => sum + ((D.region_by_product?.[p.Product_ID]?.[r]?.sales_after || 0) * segScale), 0)
        ));
        regCustomers = allRegions.map(r => {
            if (!isFiltered && !activeSegs) {
                const rd = D.regions.find(item => item.Region === r);
                return rd ? rd.customers : 0;
            }
            const rd = D.regions.find(item => item.Region === r);
            const baseCust = rd ? rd.customers : 0;
            const fullRegSales = rd ? rd.total_sales : 1;
            const curRegSales = prods.reduce((sum, p) => sum + (D.region_by_product?.[p.Product_ID]?.[r]?.sales || 0), 0);
            return Math.round(baseCust * (curRegSales / fullRegSales) * segScale);
        });
    }

    // 3. Dynamic Category Data (Category vs Product Drill-Down)
    const uniqueCats = [...new Set(prods.map(p => p.category))];
    let catLabels = uniqueCats;
    let catSales = [];

    if (uniqueCats.length === 1 || prods.length <= 5) {
        catLabels = prods.map(p => p.Product_ID);
        catSales = prods.map(p => Math.round(p.total_sales * scaleOther));
    } else {
        catLabels = uniqueCats;
        catSales = catLabels.map(cat => Math.round(
            prods.filter(p => p.category === cat).reduce((sum, p) => sum + (p.total_sales * scaleOther), 0)
        ));
    }

    // 4. Dynamic Price Bands (Price Band vs Product Drill-Down)
    const bandsDef = [
        { band: 'Budget (0-50)',     min: 0,   max: 50 },
        { band: 'Mid (51-100)',      min: 50,  max: 100 },
        { band: 'Premium (101-200)', min: 100, max: 200 },
        { band: 'Luxury (201+)',     min: 200, max: 9999 }
    ];
    let priceLabels = bandsDef.map(b => b.band);
    let priceAvgSales = [];
    let priceRevenue = [];

    if (activePrices) {
        priceLabels = prods.map(p => p.Product_ID);
        priceRevenue = prods.map(p => Math.round(p.total_revenue * scaleOther));
        priceAvgSales = prods.map(p => Number(((p.total_sales / 24) * scaleOther).toFixed(2)));
    } else {
        bandsDef.forEach(b => {
            const matching = prods.filter(p => p.avg_price > b.min && p.avg_price <= b.max);
            const totalR = matching.reduce((sum, p) => sum + p.total_revenue, 0) * scaleOther;
            const totalS = matching.reduce((sum, p) => sum + p.total_sales, 0) * scaleOther;
            priceRevenue.push(Math.round(totalR));
            priceAvgSales.push(Number((matching.length ? (totalS / matching.length) / 24 : 0).toFixed(2)));
        });
    }

    return {
        prods,
        isFiltered,
        hasSecondaryFilter,
        segScale,
        regionRatio,
        scaleOther,
        activeRegions,
        timeline: {
            months: dateFiltSales.months,
            sales: dateFiltSales.data,
            revenue: dateFiltRev.data
        },
        regions: {
            labels: regLabels,
            sales: regSales,
            revenue: regRevenue,
            salesBefore: regSalesBefore,
            salesAfter: regSalesAfter,
            customers: regCustomers
        },
        categories: {
            labels: catLabels,
            sales: catSales
        },
        priceBands: {
            labels: priceLabels,
            avgSales: priceAvgSales,
            revenue: priceRevenue
        }
    };
}


// PAGE 1: EXECUTIVE OVERVIEW
// ═══════════════════════════════════════════════════════════════════════

function applyDateFilter(months, dataArray) {
    const activeDates = getActiveFilterArray('filter-date');
    if (!activeDates) return { months, data: dataArray };
    const filteredMonths = [];
    const filteredData = [];
    months.forEach((m, i) => {
        if (activeDates.some(d => m.startsWith(d))) {
            filteredMonths.push(m);
            if (dataArray && dataArray.length > i) {
                filteredData.push(dataArray[i]);
            }
        }
    });
    return { months: filteredMonths, data: filteredData };
}

function renderExecutive() {
    const scope = getFilteredDatasetScope();
    updateChartTitles(scope);
    const prods = scope.prods;
    const isUnfiltered = !scope.isFiltered && !scope.hasSecondaryFilter;

    // 1. Exact Total Sales & Total Revenue from active Scope Timeline
    const totalSales = scope.timeline.sales.reduce((a, b) => a + b, 0);
    const totalRevenue = scope.timeline.revenue.reduce((a, b) => a + b, 0);

    // 2. Weighted Average Price
    const avgPrice = isUnfiltered
        ? D.kpis.avg_price
        : (totalSales > 0 ? (totalRevenue / totalSales) : (prods.length ? prods.reduce((sum, p) => sum + p.avg_price, 0) / prods.length : D.kpis.avg_price));

    // 3. Sales & Revenue Growth % (Split dynamically at launch month '2024-06')
    let salesGrowth = null;
    let revGrowth = null;
    let growthSubtext = null;

    if (isUnfiltered) {
        salesGrowth = D.kpis.sales_growth;
        revGrowth = D.kpis.revenue_growth;
    } else {
        const beforeSales = [], afterSales = [], beforeRev = [], afterRev = [];
        scope.timeline.months.forEach((m, idx) => {
            if (m < '2024-06') {
                beforeSales.push(scope.timeline.sales[idx] || 0);
                beforeRev.push(scope.timeline.revenue[idx] || 0);
            } else {
                afterSales.push(scope.timeline.sales[idx] || 0);
                afterRev.push(scope.timeline.revenue[idx] || 0);
            }
        });
        if (beforeSales.length > 0 && afterSales.length > 0) {
            const avgSB = beforeSales.reduce((a, b) => a + b, 0) / beforeSales.length;
            const avgSA = afterSales.reduce((a, b) => a + b, 0) / afterSales.length;
            const avgRB = beforeRev.reduce((a, b) => a + b, 0) / beforeRev.length;
            const avgRA = afterRev.reduce((a, b) => a + b, 0) / afterRev.length;
            salesGrowth = avgSB > 0 ? ((avgSA - avgSB) / avgSB) * 100 : null;
            revGrowth = avgRB > 0 ? ((avgRA - avgRB) / avgRB) * 100 : null;
        } else if (afterSales.length === 0) {
            growthSubtext = 'Pre-launch period';
        } else {
            growthSubtext = 'Post-launch period';
        }
    }

    // 4. Cannibalization Rate
    let cannRate = D.kpis.cann_rate;
    if (!isUnfiltered) {
        const legacyProds = prods.filter(p => !p.is_launched);
        if (legacyProds.length > 0) {
            const totalDrop = legacyProds.reduce((sum, p) => {
                const drop = (p.avg_before && p.avg_after < p.avg_before)
                    ? ((p.avg_before - p.avg_after) / p.avg_before) * 100
                    : (p.growth_pct < 0 ? Math.abs(p.growth_pct) : 0);
                return sum + drop;
            }, 0);
            cannRate = totalDrop / legacyProds.length;
        } else {
            cannRate = 0.0;
        }
    }

    // 5. Customer Retention Rate
    let retentionRate = D.kpis.retention_rate;
    if (!isUnfiltered && prods.length > 0) {
        const sumRet = prods.reduce((sum, p) => {
            if (p.is_launched) return sum + 92.4;
            const drop = (p.avg_before && p.avg_after < p.avg_before)
                ? ((p.avg_before - p.avg_after) / p.avg_before) * 100
                : (p.growth_pct < 0 ? Math.abs(p.growth_pct) : 0);
            return sum + Math.max(62.0, D.kpis.retention_rate - (drop * 0.35));
        }, 0);
        retentionRate = sumRet / prods.length;
    }

    // 6. Average Rating
    const avgRating = isUnfiltered
        ? D.kpis.avg_rating
        : (prods.length > 0 ? prods.reduce((sum, p) => sum + (p.avg_rating || 4.0), 0) / prods.length : D.kpis.avg_rating);

    // 7. Marketing ROI (Exact sum(revenue) / sum(mkt_spend))
    let mktRoi = D.kpis.mkt_roi;
    if (!isUnfiltered && prods.length > 0) {
        const totRev = prods.reduce((s, p) => s + (p.total_revenue || 0), 0);
        const totSpend = prods.reduce((s, p) => s + (p.mkt_spend || 0), 0);
        mktRoi = totSpend > 0 ? (totRev / totSpend) : D.kpis.mkt_roi;
    }

    // 8. Stock Availability Rate
    let stockAvail = D.kpis.stock_avail;
    if (!isUnfiltered && prods.length > 0) {
        stockAvail = prods.reduce((s, p) => s + (p.stock_avail ?? D.kpis.stock_avail), 0) / prods.length;
    }

    const isDark = document.body.classList.contains('dark-theme');
    const grid = document.getElementById('kpi-grid');
    if (grid) {
        grid.innerHTML = '';
        grid.appendChild(createKPI('Total Sales', fmtFull(totalSales) + ' units', salesGrowth, 'blue', 'growth', 'package', growthSubtext));
        grid.appendChild(createKPI('Total Revenue', '₹' + fmt(totalRevenue), revGrowth, 'teal', 'growth', 'dollar-sign', growthSubtext));
        grid.appendChild(createKPI('Avg Price', '₹' + avgPrice.toFixed(2), null, 'amber', '', 'tag', prods.length === 1 ? 'Product unit price' : 'Weighted average price'));
        grid.appendChild(createKPI('Cannibalization Rate', cannRate.toFixed(1) + '%', null, 'red', '', 'git-compare', prods.length === 1 ? (prods[0].is_launched ? 'Newly Launched Line' : 'Cannibalized Line') : (isUnfiltered ? 'Impact rate' : 'Filtered scope rate')));
        grid.appendChild(createKPI('Customer Retention', retentionRate.toFixed(1) + '%', null, 'green', '', 'users', isUnfiltered ? 'Active retention rate' : 'Active scope retention'));
        grid.appendChild(createKPI('Avg Rating', avgRating.toFixed(2) + ' / 5', null, 'purple', '', 'star', 'Out of 5.0 scale'));
        grid.appendChild(createKPI('Marketing ROI', mktRoi.toFixed(2) + 'x', null, 'cyan', '', 'target', 'Revenue per ₹ spend'));
        grid.appendChild(createKPI('Stock Availability', stockAvail.toFixed(1) + '%', null, 'pink', '', 'boxes', isUnfiltered ? 'In-stock rate' : 'In-stock rate (Scope)'));
    }

    const ctx = getCtx('chart-exec-trend');
    if (ctx) {
        createChart('chart-exec-trend', ctx, {
            type: 'line',
            data: {
                labels: scope.timeline.months,
                datasets: [{
                    label: 'Sales',
                    data: scope.timeline.sales,
                    borderColor: COLORS.blue,
                    backgroundColor: COLORS.blueBg,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                }, {
                    label: 'Revenue',
                    data: scope.timeline.revenue,
                    borderColor: COLORS.teal,
                    backgroundColor: COLORS.tealBg,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y:  { position: 'left',  title: { display: true, text: 'Sales (Units)' } },
                    y1: { position: 'right', title: { display: true, text: 'Revenue (₹)' }, grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    const ctxCat = getCtx('chart-exec-category');
    if (ctxCat) {
        createChart('chart-exec-category', ctxCat, {
            type: 'doughnut',
            data: {
                labels: scope.categories.labels,
                datasets: [{
                    data: scope.categories.sales,
                    backgroundColor: PALETTE,
                    borderColor: isDark ? '#1e293b' : '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                cutout: '58%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', font: { size: 12, weight: '500' } }
                    },
                    datalabels: {
                        color: '#ffffff',
                        font: { weight: 'bold', size: 12 },
                        formatter: (value, context) => {
                            const dataArr = context.chart.data.datasets[0].data;
                            const sum = dataArr.reduce((a, b) => a + b, 0);
                            if (sum === 0 || value === 0) return '';
                            const pct = (value * 100 / sum);
                            return pct < 3 ? '' : pct.toFixed(1) + '%';
                        }
                    }
                }
            }
        });
    }

    const ctxReg = getCtx('chart-exec-region');
    if (ctxReg) {
        createChart('chart-exec-region', ctxReg, {
            type: 'doughnut',
            data: {
                labels: scope.regions.labels,
                datasets: [{
                    data: scope.regions.sales,
                    backgroundColor: PALETTE,
                    borderColor: isDark ? '#1e293b' : '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                cutout: '58%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', font: { size: 12, weight: '500' } }
                    },
                    datalabels: {
                        color: '#ffffff',
                        font: { weight: 'bold', size: 12 },
                        formatter: (value, context) => {
                            const dataArr = context.chart.data.datasets[0].data;
                            const sum = dataArr.reduce((a, b) => a + b, 0);
                            if (sum === 0 || value === 0) return '';
                            const pct = (value * 100 / sum);
                            return pct < 3 ? '' : pct.toFixed(1) + '%';
                        }
                    }
                }
            }
        });
    }

}

function renderSales() {
    const scope = getFilteredDatasetScope();
    updateChartTitles(scope);
    const prods = scope.prods;

    const salesGrid = document.getElementById('sales-kpis');
    if (salesGrid) {
        const totSales = scope.timeline.sales.reduce((a, b) => a + b, 0);
        const beforeArr = [], afterArr = [];
        let peakVal = -1, peakMonth = 'N/A';
        scope.timeline.months.forEach((m, i) => {
            const v = scope.timeline.sales[i] || 0;
            if (v > peakVal) { peakVal = v; peakMonth = m; }
            if (m < '2024-06') beforeArr.push(v); else afterArr.push(v);
        });
        const avgBefore = beforeArr.length ? Math.round(beforeArr.reduce((a, b) => a + b, 0) / beforeArr.length) : 0;
        const avgAfter = afterArr.length ? Math.round(afterArr.reduce((a, b) => a + b, 0) / afterArr.length) : 0;
        salesGrid.innerHTML = '';
        salesGrid.appendChild(createKPI('Total Units Sold', fmtFull(totSales), null, 'blue', '', 'shopping-cart', `${scope.timeline.months.length} active months`));
        salesGrid.appendChild(createKPI('Pre-Launch Avg / Mo', avgBefore ? fmtFull(avgBefore) + ' units' : 'N/A', null, 'teal', '', 'calendar', `${beforeArr.length} pre-launch months`));
        salesGrid.appendChild(createKPI('Post-Launch Avg / Mo', avgAfter ? fmtFull(avgAfter) + ' units' : 'N/A', null, 'amber', '', 'trending-up', `${afterArr.length} post-launch months`));
        salesGrid.appendChild(createKPI('Peak Sales Month', peakMonth, null, 'purple', '', 'award', peakVal >= 0 ? fmtFull(peakVal) + ' units' : 'No data'));
    }

    const ctx1 = getCtx('chart-sales-monthly');
    const launchIdx = scope.timeline.months.indexOf('2024-06');
    createChart('chart-sales-monthly', ctx1, {
        type: 'bar',
        data: {
            labels: scope.timeline.months,
            datasets: [{
                label: 'Monthly Sales',
                data: scope.timeline.sales,
                backgroundColor: scope.timeline.months.map((m, i) => (launchIdx > -1 && i >= launchIdx) ? COLORS.tealBg : COLORS.blueBg),
                borderColor: scope.timeline.months.map((m, i) => (launchIdx > -1 && i >= launchIdx) ? COLORS.teal : COLORS.blue),
                borderWidth: 1
            }]
        },
        options: { responsive: true, scales: { y: { title: { display: true, text: 'Sales (Units)' } } } }
    });

    // Category / Product before vs after (exact sales_before / sales_after)
    const ctx2 = getCtx('chart-sales-cat-ba');
    const uniqueCats = [...new Set(prods.map(p => p.category))];
    const isProdDrill = uniqueCats.length === 1 || prods.length <= 5;
    const catBefore = scope.categories.labels.map(lbl => {
        const subset = isProdDrill ? prods.filter(p => p.Product_ID === lbl) : prods.filter(p => p.category === lbl);
        return Math.round(subset.reduce((sum, p) => sum + ((p.sales_before || 0) * scope.scaleOther), 0));
    });
    const catAfter = scope.categories.labels.map(lbl => {
        const subset = isProdDrill ? prods.filter(p => p.Product_ID === lbl) : prods.filter(p => p.category === lbl);
        return Math.round(subset.reduce((sum, p) => sum + ((p.sales_after || 0) * scope.scaleOther), 0));
    });
    createChart('chart-sales-cat-ba', ctx2, {
        type: 'bar',
        data: {
            labels: scope.categories.labels,
            datasets: [
                { label: 'Before Launch', data: catBefore, backgroundColor: COLORS.blue },
                { label: 'After Launch',  data: catAfter,  backgroundColor: COLORS.teal }
            ]
        },
        options: { responsive: true }
    });

    // Region before/after (exact from D.region_by_product)
    const ctx3 = getCtx('chart-sales-reg-ba');
    createChart('chart-sales-reg-ba', ctx3, {
        type: 'bar',
        data: {
            labels: scope.regions.labels,
            datasets: [
                { label: 'Before Launch', data: scope.regions.salesBefore, backgroundColor: COLORS.blue },
                { label: 'After Launch',  data: scope.regions.salesAfter,  backgroundColor: COLORS.teal }
            ]
        },
        options: { responsive: true }
    });

    // Product group trends (exact sum of filtered products per group, no double-scaling)
    const ctx4 = getCtx('chart-sales-groups');
    let groups = Object.keys(D.group_trends);
    if (scope.isFiltered) {
        groups = [...new Set(prods.map(p => p.group))];
    }
    const datasets = groups.map((g, i) => {
        let groupMonthly;
        if (scope.isFiltered && D.monthly_by_product) {
            const gProds = prods.filter(p => p.group === g);
            const raw = new Array(D.monthly_trends.months.length).fill(0);
            gProds.forEach(p => {
                const pm = D.monthly_by_product[p.Product_ID];
                if (pm) pm.sales.forEach((v, idx) => { raw[idx] += v; });
            });
            groupMonthly = applyDateFilter(D.monthly_trends.months, raw);
        } else {
            groupMonthly = applyDateFilter(D.group_trends[g]?.months || [], D.group_trends[g]?.sales || []);
        }
        return {
            label: g,
            data: padData(groupMonthly.months, groupMonthly.data.map(v => Math.round(v * scope.scaleOther)), scope.timeline.months),
            borderColor: PALETTE[i % PALETTE.length],
            backgroundColor: 'transparent',
            borderWidth: 2,
            hidden: false,
            tension: 0.3
        };
    });
    createChart('chart-sales-groups', ctx4, {
        type: 'line',
        data: { labels: scope.timeline.months, datasets },
        options: { responsive: true, interaction: { mode: 'index', intersect: false } }
    });

}

function renderProducts() {
    const dataSource = window.filteredProducts || D.products;
    const prods = [...dataSource].sort((a, b) => b.total_revenue - a.total_revenue);

    const prodGrid = document.getElementById('prod-kpis');
    if (prodGrid) {
        const topProd = prods[0];
        const existing = prods.filter(p => !p.is_launched);
        const fastest = [...existing].sort((a, b) => b.growth_pct - a.growth_pct)[0];
        const worst = [...existing].sort((a, b) => a.growth_pct - b.growth_pct)[0];
        const launchedCount = prods.filter(p => p.is_launched).length;
        prodGrid.innerHTML = '';
        prodGrid.appendChild(createKPI('Active Products', String(prods.length), null, 'blue', '', 'package', `${launchedCount} launched, ${existing.length} existing`));
        prodGrid.appendChild(createKPI('Top Revenue Product', topProd ? topProd.Product_ID : 'N/A', null, 'teal', '', 'trophy', topProd ? `₹${fmt(topProd.total_revenue)} (${topProd.category})` : ''));
        prodGrid.appendChild(createKPI('Fastest Growing', fastest ? fastest.Product_ID : 'N/A', fastest ? fastest.growth_pct : null, 'green', 'growth', 'trending-up', fastest ? null : 'No existing products'));
        prodGrid.appendChild(createKPI('Most Cannibalized', worst ? worst.Product_ID : 'N/A', worst ? worst.growth_pct : null, 'red', 'growth', 'trending-down', worst ? null : 'No existing products'));
    }

    // Revenue bar
    const ctx1 = getCtx('chart-prod-revenue');
    createChart('chart-prod-revenue', ctx1, {
        type: 'bar',
        data: {
            labels: prods.map(p => p.Product_ID),
            datasets: [
                {
                    label: 'Existing Products',
                    data: prods.map(p => p.is_launched ? null : p.total_revenue),
                    backgroundColor: COLORS.blue,
                    borderRadius: 4
                },
                {
                    label: 'Newly Launched (P1-P5)',
                    data: prods.map(p => p.is_launched ? p.total_revenue : null),
                    backgroundColor: COLORS.red,
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            scales: { x: { stacked: true }, y: { stacked: true } },
            plugins: { legend: { display: true } }
        }
    });

    // Growth chart
    const sorted = [...dataSource].filter(p => !p.is_launched).sort((a, b) => a.growth_pct - b.growth_pct);
    const ctx2 = getCtx('chart-prod-growth');
    createChart('chart-prod-growth', ctx2, {
        type: 'bar',
        data: {
            labels: sorted.map(p => p.Product_ID),
            datasets: [{
                label: 'Sales Growth %',
                data: sorted.map(p => p.growth_pct),
                backgroundColor: sorted.map(p => p.growth_pct >= 0 ? COLORS.green : COLORS.red),
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });

    // Product table
    const wrapper = document.getElementById('product-table-wrapper');
    let html = `<table class="data-table">
        <thead><tr>
            <th>Product</th><th>Category</th><th>Group</th><th>Type</th>
            <th>Total Sales</th><th>Total Revenue</th><th>Avg Price</th>
            <th>Avg Rating</th><th>Growth %</th>
        </tr></thead><tbody>`;
    prods.forEach(p => {
        const badge = p.is_launched ? '<span class="badge launched">Launched</span>' : '<span class="badge existing">Existing</span>';
        const growthClass = p.growth_pct < -5 ? 'negative' : p.growth_pct > 5 ? 'positive' : '';
        html += `<tr>
            <td><strong>${p.Product_ID}</strong></td>
            <td>${p.category}</td><td>${p.group}</td><td>${badge}</td>
            <td>${fmtFull(p.total_sales)}</td><td>₹${fmt(p.total_revenue)}</td>
            <td>₹${p.avg_price.toFixed(0)}</td><td>${p.avg_rating.toFixed(1)}</td>
            <td><span class="badge ${growthClass}">${p.growth_pct > 0 ? '+' : ''}${p.growth_pct.toFixed(1)}%</span></td>
        </tr>`;
    });
    html += '</tbody></table>';
    wrapper.innerHTML = html;
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 4: CANNIBALIZATION ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

function renderCannibalization() {
    const scope = getFilteredDatasetScope();
    const c = D.cannibalization;
    const prods = scope.prods;
    const isUnfiltered = !scope.isFiltered && !scope.hasSecondaryFilter;
    const hasP6 = prods.some(p => p.Product_ID === 'P6');
    const hasP4 = prods.some(p => p.Product_ID === 'P4');
    const hasP5 = prods.some(p => p.Product_ID === 'P5');

    let dynCannRate = c.rate;
    if (!isUnfiltered) {
        const legacyProds = prods.filter(p => !p.is_launched);
        if (legacyProds.length > 0) {
            const totalDrop = legacyProds.reduce((sum, p) => {
                const drop = (p.avg_before && p.avg_after < p.avg_before)
                    ? ((p.avg_before - p.avg_after) / p.avg_before) * 100
                    : (p.growth_pct < 0 ? Math.abs(p.growth_pct) : 0);
                return sum + drop;
            }, 0);
            dynCannRate = totalDrop / legacyProds.length;
        } else {
            dynCannRate = 0.0;
        }
    }

    const p6LossVal = hasP6 ? Math.round(c.p6_loss * scope.scaleOther) : 0;
    const p4p5GainVal = (hasP4 || hasP5) ? Math.round(c.p4p5_gain * scope.scaleOther) : 0;
    const switchRateVal = isUnfiltered ? c.switching_rate : (hasP6 || hasP4 || hasP5 ? c.switching_rate : 0.0);

    const grid = document.getElementById('cann-kpis');
    if (grid) {
        grid.innerHTML = '';
        grid.appendChild(createKPI('Cannibalization Rate', dynCannRate.toFixed(1) + '%', null, 'red', '', 'git-compare', isUnfiltered ? 'Portfolio Impact' : 'Filtered Scope Impact'));
        grid.appendChild(createKPI('P6 Sales Lost', fmtFull(p6LossVal) + ' units', null, 'amber', '', 'trending-down', 'Impact on P6 Baseline'));
        grid.appendChild(createKPI('P4+P5 Sales Gained', fmtFull(p4p5GainVal) + ' units', null, 'teal', '', 'trending-up', 'New Line Gain'));
        grid.appendChild(createKPI('Customer Switching', switchRateVal.toFixed(1) + '%', null, 'purple', '', 'refresh-cw', 'Switching Ratio'));
    }

    // Timeline
    const ctx1 = getCtx('chart-cann-timeline');
    const t = c.timeline;
    
    const p6Filt = applyDateFilter(t.P6.months, t.P6.sales);
    const p4Filt = applyDateFilter(t.P4.months, t.P4.sales);
    const p5Filt = applyDateFilter(t.P5.months, t.P5.sales);

    // hasP6, hasP4, hasP5 computed above

    createChart('chart-cann-timeline', ctx1, {
        type: 'line',
        data: {
            labels: p6Filt.months,
            datasets: [
                { label: 'P6 (Cannibalized)', data: hasP6 ? p6Filt.data.map(v => Math.round(v * scope.scaleOther)) : p6Filt.data.map(() => 0), borderColor: COLORS.red, backgroundColor: COLORS.redBg, fill: true, tension: 0.3, borderWidth: 3 },
                { label: 'P4 (Launched)', data: hasP4 ? padData(p4Filt.months, p4Filt.data.map(v => Math.round(v * scope.scaleOther)), p6Filt.months) : p6Filt.months.map(() => 0), borderColor: COLORS.blue, tension: 0.3, borderWidth: 2 },
                { label: 'P5 (Launched)', data: hasP5 ? padData(p5Filt.months, p5Filt.data.map(v => Math.round(v * scope.scaleOther)), p6Filt.months) : p6Filt.months.map(() => 0), borderColor: COLORS.green, tension: 0.3, borderWidth: 2 }
            ]
        },
        options: { responsive: true, scales: { y: { title: { display: true, text: 'Total Sales' } } } }
    });

    // Migration pie
    const ctx2 = getCtx('chart-cann-migration');
    const m = c.migration;
    createChart('chart-cann-migration', ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Switched to P4/P5', 'Stayed with P6', 'Lost'],
            datasets: [{
                data: hasP6 ? [Math.round(m.switched * scope.scaleOther), Math.round(m.stayed * scope.scaleOther), Math.round(m.lost * scope.scaleOther)] : [0, 0, 0],
                backgroundColor: [COLORS.red, COLORS.green, COLORS.amber],
                borderColor: document.body.classList.contains('dark-theme') ? '#1e293b' : '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            cutout: '58%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', font: { size: 12, weight: '500' } }
                },
                datalabels: {
                    color: '#ffffff',
                    font: { weight: 'bold', size: 12 },
                    formatter: (value, context) => {
                        const dataArr = context.chart.data.datasets[0].data;
                        const sum = dataArr.reduce((a, b) => a + b, 0);
                        if (sum === 0 || value === 0) return '';
                        const pct = (value * 100 / sum);
                        return pct < 3 ? '' : pct.toFixed(1) + '%';
                    }
                }
            }
        }
    });

    // Product change bar
    const sorted = [...prods].filter(p => !p.is_launched).sort((a, b) => a.growth_pct - b.growth_pct);
    const ctx3 = getCtx('chart-cann-change');
    createChart('chart-cann-change', ctx3, {
        type: 'bar',
        data: {
            labels: sorted.map(p => p.Product_ID),
            datasets: [{
                label: 'Sales Change %',
                data: sorted.map(p => p.growth_pct),
                backgroundColor: sorted.map(p => p.growth_pct >= 0 ? COLORS.green : COLORS.red)
            }]
        },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }
    });

    // Product x Month Demand Shift Heatmap
    const hmWrap = document.getElementById('cann-heatmap-wrapper');
    if (hmWrap && D.cannibalization.product_month_heatmap) {
        const hm = D.cannibalization.product_month_heatmap;
        const activeIds = new Set(prods.map(p => p.Product_ID));
        const activeDates = getActiveFilterArray('filter-date');
        const monthIndices = hm.months.map((m, i) => (!activeDates || activeDates.some(d => m.startsWith(d))) ? i : -1).filter(i => i !== -1);
        const rows = hm.rows.filter(r => activeIds.has(r.product)).slice(0, 12);
        const isDark = document.body.classList.contains('dark-theme');

        let hHtml = '<table class="heatmap-table"><thead><tr><th class="row-head">Product</th>';
        monthIndices.forEach(idx => {
            hHtml += `<th>${hm.months[idx].slice(2)}</th>`;
        });
        hHtml += '</tr></thead><tbody>';

        rows.forEach(r => {
            hHtml += `<tr><th class="row-head">${r.product}</th>`;
            monthIndices.forEach(idx => {
                const v = r.pct_change[idx];
                let bg, fg;
                if (v <= -25) { bg = 'rgba(239, 68, 68, 0.78)'; fg = '#fff'; }
                else if (v <= -10) { bg = 'rgba(239, 68, 68, 0.42)'; fg = isDark ? '#fff' : '#7f1d1d'; }
                else if (v < 0) { bg = 'rgba(239, 68, 68, 0.16)'; fg = isDark ? '#fecaca' : '#991b1b'; }
                else if (v >= 25) { bg = 'rgba(20, 184, 166, 0.78)'; fg = '#fff'; }
                else if (v > 5) { bg = 'rgba(20, 184, 166, 0.35)'; fg = isDark ? '#fff' : '#115e59'; }
                else { bg = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.14)'; fg = isDark ? '#cbd5e1' : '#475569'; }
                hHtml += `<td><div class="heatmap-cell" style="background:${bg};color:${fg}" title="${r.product} (${hm.months[idx]}): ${v > 0 ? '+' : ''}${v}%">${v > 0 ? '+' : ''}${Math.round(v)}%</div></td>`;
            });
            hHtml += '</tr>';
        });
        hHtml += '</tbody></table>';
        hHtml += `<div class="heatmap-legend"><span><span class="heatmap-legend-swatch" style="background:rgba(239,68,68,0.75)"></span>Strong Drop (&le;-25%)</span><span><span class="heatmap-legend-swatch" style="background:rgba(148,163,184,0.2)"></span>Neutral</span><span><span class="heatmap-legend-swatch" style="background:rgba(20,184,166,0.75)"></span>Strong Gain (&ge;+25%)</span></div>`;
        hmWrap.innerHTML = hHtml;
    }
}

function padData(srcMonths, srcData, targetMonths) {
    const map = {};
    srcMonths.forEach((m, i) => map[m] = srcData[i]);
    return targetMonths.map(m => map[m] ?? null);
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 5: CUSTOMER INSIGHTS
// ═══════════════════════════════════════════════════════════════════════

function renderCustomers() {
    const scope = getFilteredDatasetScope();
    updateChartTitles(scope);
    const k = D.kpis;
    const prods = scope.prods;
    const isUnfiltered = !scope.isFiltered && !scope.hasSecondaryFilter;
    const custScale = (prods.length / D.products.length) * scope.scaleOther;

    let dynRet = k.retention_rate;
    if (!isUnfiltered && prods.length > 0) {
        const sumRet = prods.reduce((sum, p) => {
            if (p.is_launched) return sum + 92.4;
            const drop = (p.avg_before && p.avg_after < p.avg_before) ? ((p.avg_before - p.avg_after) / p.avg_before) * 100 : 0;
            return sum + Math.max(62.0, k.retention_rate - (drop * 0.35));
        }, 0);
        dynRet = sumRet / prods.length;
    }
    const dynSwitch = isUnfiltered ? D.cannibalization.switching_rate : Math.min(35.0, Math.max(5.0, (100 - dynRet) * 0.75));
    const totalCust = isUnfiltered ? k.total_customers : Math.round(k.total_customers * custScale);

    const grid = document.getElementById('cust-kpis');
    const retainedCust = Math.round(totalCust * (dynRet / 100));
    if (grid) {
        grid.innerHTML = '';
        grid.appendChild(createKPI('Total Customers', fmtFull(totalCust), null, 'blue', '', 'users', 'Active customer base'));
        grid.appendChild(createKPI('Retained Customers', fmtFull(retainedCust), null, 'teal', '', 'shield-check', 'Active across periods'));
        grid.appendChild(createKPI('Retention Rate', dynRet.toFixed(1) + '%', null, 'green', '', 'user-check', isUnfiltered ? 'Portfolio retention' : 'Filtered scope retention'));
        grid.appendChild(createKPI('Switching Rate', dynSwitch.toFixed(1) + '%', null, 'red', '', 'repeat', 'Migration to new lines'));
    }

    const ctx1 = getCtx('chart-cust-region');
    const regCust = scope.regions.customers;
    createChart('chart-cust-region', ctx1, {
        type: 'doughnut',
        data: {
            labels: scope.regions.labels,
            datasets: [{ data: regCust, backgroundColor: PALETTE }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // Switching pie - UNIFIED SCOPE
    const m = D.cannibalization.migration;
    const ctx2 = getCtx('chart-cust-switching');
    createChart('chart-cust-switching', ctx2, {
        type: 'pie',
        data: {
            labels: ['Switched to New Products', 'Stayed with P6', 'Churned'],
            datasets: [{
                data: isUnfiltered ? [m.switched, m.stayed, m.lost] : [Math.round(m.switched * custScale), Math.round(m.stayed * custScale), Math.round(m.lost * custScale)],
                backgroundColor: [COLORS.red, COLORS.green, COLORS.amber],
                borderColor: document.body.classList.contains('dark-theme') ? '#1e293b' : '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', font: { size: 12, weight: '500' } }
                },
                datalabels: {
                    color: '#ffffff',
                    font: { weight: 'bold', size: 12 },
                    formatter: (value, context) => {
                        const dataArr = context.chart.data.datasets[0].data;
                        const sum = dataArr.reduce((a, b) => a + b, 0);
                        if (sum === 0 || value === 0) return '';
                        const pct = (value * 100 / sum);
                        return pct < 3 ? '' : pct.toFixed(1) + '%';
                    }
                }
            }
        }
    });
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 6: PRICING ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

function renderPricing() {
    const scope = getFilteredDatasetScope();
    updateChartTitles(scope);
    const prods = [...scope.prods].sort((a, b) => b.avg_price - a.avg_price);

    const pGrid = document.getElementById('pricing-kpis');
    if (pGrid) {
        const totS = prods.reduce((s, p) => s + p.total_sales, 0);
        const totR = prods.reduce((s, p) => s + p.total_revenue, 0);
        const wAvg = totS > 0 ? (totR / totS) : D.kpis.avg_price;
        const launched = prods.filter(p => p.is_launched);
        const legacy = prods.filter(p => !p.is_launched);
        const lAvg = launched.length ? launched.reduce((s, p) => s + p.avg_price, 0) / launched.length : 0;
        const eAvg = legacy.length ? legacy.reduce((s, p) => s + p.avg_price, 0) / legacy.length : 0;
        let topBand = 'N/A', topBandRev = -1;
        scope.priceBands.labels.forEach((lbl, idx) => {
            if ((scope.priceBands.revenue[idx] || 0) > topBandRev) {
                topBandRev = scope.priceBands.revenue[idx] || 0;
                topBand = lbl;
            }
        });
        pGrid.innerHTML = '';
        pGrid.appendChild(createKPI('Weighted Avg Price', `₹${wAvg.toFixed(2)}`, null, 'blue', '', 'tag', 'Portfolio weighted average'));
        pGrid.appendChild(createKPI('Launched Avg Price', lAvg ? `₹${lAvg.toFixed(2)}` : 'N/A', null, 'teal', '', 'rocket', `${launched.length} new lines`));
        pGrid.appendChild(createKPI('Legacy Avg Price', eAvg ? `₹${eAvg.toFixed(2)}` : 'N/A', null, 'amber', '', 'layers', `${legacy.length} existing lines`));
        pGrid.appendChild(createKPI('Top Revenue Segment', topBand, null, 'purple', '', 'award', topBandRev >= 0 ? `₹${fmt(topBandRev)} revenue` : ''));
    }

    const ctx1 = getCtx('chart-price-product');
    createChart('chart-price-product', ctx1, {
        type: 'bar',
        data: {
            labels: prods.map(p => p.Product_ID),
            datasets: [
                {
                    label: 'Existing Products',
                    data: prods.map(p => p.is_launched ? null : p.avg_price),
                    backgroundColor: COLORS.blue,
                    borderRadius: 4
                },
                {
                    label: 'Newly Launched (P1-P5)',
                    data: prods.map(p => p.is_launched ? p.avg_price : null),
                    backgroundColor: COLORS.red,
                    borderRadius: 4
                }
            ]
        },
        options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }
    });

    const ctxBox = getCtx('chart-price-boxplot');
    if (ctxBox && D.price_boxplot) {
        const activeCats = new Set(prods.map(p => p.category));
        const boxData = D.price_boxplot.filter(b => activeCats.has(b.category));
        const hasBoxplotPlugin = !!(Chart.registry && Chart.registry.controllers && Chart.registry.controllers.get('boxplot'));
        if (hasBoxplotPlugin) {
            createChart('chart-price-boxplot', ctxBox, {
                type: 'boxplot',
                data: {
                    labels: boxData.map(b => b.category),
                    datasets: [{
                        label: 'Price Distribution (₹)',
                        data: boxData.map(b => ({ min: b.min, q1: b.q1, median: b.median, q3: b.q3, max: b.max, mean: b.mean })),
                        backgroundColor: 'rgba(99, 102, 241, 0.35)',
                        borderColor: COLORS.blue,
                        borderWidth: 2,
                        medianColor: COLORS.red,
                        outlierBackgroundColor: COLORS.amber
                    }]
                },
                options: { responsive: true, scales: { y: { title: { display: true, text: 'Price (₹)' } } } }
            });
        } else {
            createChart('chart-price-boxplot', ctxBox, {
                type: 'bar',
                data: {
                    labels: boxData.map(b => b.category),
                    datasets: [
                        { label: 'IQR (Q1 - Q3)', data: boxData.map(b => [b.q1, b.q3]), backgroundColor: 'rgba(99, 102, 241, 0.45)', borderColor: COLORS.blue, borderWidth: 1.5, borderRadius: 4 },
                        { label: 'Median Price', data: boxData.map(b => b.median), type: 'line', borderColor: COLORS.red, backgroundColor: COLORS.red, pointRadius: 6, showLine: false }
                    ]
                },
                options: { responsive: true, scales: { y: { title: { display: true, text: 'Price (₹)' } } } }
            });
        }
    }

    const ctx2 = getCtx('chart-price-band');
    createChart('chart-price-band', ctx2, {
        type: 'bar',
        data: {
            labels: scope.priceBands.labels,
            datasets: [{
                label: 'Avg Monthly Sales / Product',
                data: scope.priceBands.avgSales,
                backgroundColor: PALETTE
            }]
        },
        options: { responsive: true }
    });

    const ctx3 = getCtx('chart-price-revenue');
    createChart('chart-price-revenue', ctx3, {
        type: 'bar',
        data: {
            labels: scope.priceBands.labels,
            datasets: [{
                label: 'Total Revenue',
                data: scope.priceBands.revenue,
                backgroundColor: PALETTE,
                borderRadius: 4
            }]
        },
        options: { responsive: true }
    });

}

function renderMarketing() {
    const scope = getFilteredDatasetScope();
    const prods = scope.prods;
    const isFiltered = scope.isFiltered;
    const mkt = isFiltered ? prods.map(p => D.marketing.find(m => m.product === p.Product_ID)).filter(Boolean) : D.marketing;

    const mGrid = document.getElementById('mkt-kpis');
    if (mGrid) {
        const totSpend = prods.reduce((s, p) => s + (p.mkt_spend || 0), 0) * scope.scaleOther;
        const totRev = prods.reduce((s, p) => s + (p.total_revenue || 0), 0) * scope.scaleOther;
        const portRoi = totSpend > 0 ? (totRev / totSpend) : D.kpis.mkt_roi;
        const launched = prods.filter(p => p.is_launched);
        const lSpend = launched.reduce((s, p) => s + (p.mkt_spend || 0), 0);
        const lRev = launched.reduce((s, p) => s + (p.total_revenue || 0), 0);
        const lRoi = lSpend > 0 ? (lRev / lSpend) : 0;
        const topMkt = [...mkt].sort((a, b) => b.roi - a.roi)[0];

        mGrid.innerHTML = '';
        mGrid.appendChild(createKPI('Total Marketing Spend', `₹${fmt(totSpend)}`, null, 'blue', '', 'wallet', 'Campaign investment'));
        mGrid.appendChild(createKPI('Portfolio ROI', `${portRoi.toFixed(2)}x`, null, 'teal', '', 'target', 'Revenue per ₹1 spend'));
        mGrid.appendChild(createKPI('Launched Line ROI', lRoi ? `${lRoi.toFixed(2)}x` : 'N/A', null, 'amber', '', 'rocket', `${launched.length} new products`));
        mGrid.appendChild(createKPI('Top ROI Product', topMkt ? topMkt.product : 'N/A', null, 'purple', '', 'award', topMkt ? `${topMkt.roi.toFixed(2)}x efficiency` : ''));
    }

    const ctx = getCtx('chart-mkt-roi');
    createChart('chart-mkt-roi', ctx, {
        type: 'bar',
        data: {
            labels: mkt.map(m => m.product),
            datasets: [
                {
                    label: 'Existing Products',
                    data: mkt.map(m => m.is_launched ? null : m.roi),
                    backgroundColor: COLORS.blue,
                    borderRadius: 4
                },
                {
                    label: 'Newly Launched (P1-P5)',
                    data: mkt.map(m => m.is_launched ? m.roi : null),
                    backgroundColor: COLORS.red,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            scales: { x: { stacked: true }, y: { stacked: true } },
            plugins: { legend: { display: true } }
        }
    });

    const ctx2 = getCtx('chart-mkt-spend-rev');
    if (ctx2) {
        const sortedP = [...prods].sort((a, b) => (b.mkt_spend || 0) - (a.mkt_spend || 0));
        createChart('chart-mkt-spend-rev', ctx2, {
            type: 'bar',
            data: {
                labels: sortedP.map(p => p.Product_ID),
                datasets: [
                    { label: 'Marketing Spend', data: sortedP.map(p => Math.round((p.mkt_spend || 0) * scope.scaleOther)), backgroundColor: COLORS.amber, borderRadius: 3 },
                    { label: 'Total Revenue', data: sortedP.map(p => Math.round((p.total_revenue || 0) * scope.scaleOther)), backgroundColor: COLORS.teal, borderRadius: 3 }
                ]
            },
            options: { responsive: true, interaction: { mode: 'index', intersect: false } }
        });
    }

    const ctx3 = getCtx('chart-mkt-trend');
    if (ctx3 && D.monthly_trends.spend) {
        const spendFilt = applyDateFilter(D.monthly_trends.months, D.monthly_trends.spend);
        const prodRatio = prods.reduce((s, p) => s + (p.mkt_spend || 0), 0) / (D.products.reduce((s, p) => s + (p.mkt_spend || 0), 0) || 1);
        const scaledSpend = spendFilt.data.map(v => Math.round(v * prodRatio * scope.scaleOther));
        const monthlyRoi = scope.timeline.revenue.map((rev, i) => scaledSpend[i] > 0 ? Number((rev / scaledSpend[i]).toFixed(2)) : 0);
        createChart('chart-mkt-trend', ctx3, {
            type: 'line',
            data: {
                labels: scope.timeline.months,
                datasets: [
                    { label: 'Marketing Spend', data: scaledSpend, borderColor: COLORS.amber, backgroundColor: 'rgba(245,158,11,0.12)', fill: true, tension: 0.35, yAxisID: 'y' },
                    { label: 'Monthly ROI (x)', data: monthlyRoi, borderColor: COLORS.purple, tension: 0.35, borderWidth: 2.5, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { position: 'left', title: { display: true, text: 'Spend (₹)' } },
                    y1: { position: 'right', title: { display: true, text: 'ROI (x)' }, grid: { drawOnChartArea: false } }
                }
            }
        });
    }
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 8: INVENTORY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

function renderInventory() {
    const inv = D.inventory;
    const prods = window.filteredProducts || D.products;
    const isFiltered = prods.length < D.products.length;

    const iGrid = document.getElementById('inv-kpis');
    if (iGrid) {
        const avgAvail = prods.length ? (prods.reduce((s, p) => s + (p.stock_avail ?? D.kpis.stock_avail), 0) / prods.length) : D.kpis.stock_avail;
        const totOos = prods.reduce((s, p) => s + (p.oos_count || 0), 0);
        const worstProd = [...prods].sort((a, b) => (b.oos_count || 0) - (a.oos_count || 0))[0];
        const postLaunchMonths = inv.months.map((m, i) => m >= '2024-06' ? inv.stock_pct[i] : null).filter(v => v !== null);
        const postAvail = postLaunchMonths.length ? (postLaunchMonths.reduce((a, b) => a + b, 0) / postLaunchMonths.length) : avgAvail;

        iGrid.innerHTML = '';
        iGrid.appendChild(createKPI('Stock Availability', `${avgAvail.toFixed(1)}%`, null, 'green', '', 'boxes', isFiltered ? 'Filtered scope rate' : 'Portfolio in-stock rate'));
        iGrid.appendChild(createKPI('Out-of-Stock Events', fmtFull(totOos), null, 'red', '', 'alert-triangle', 'Total stockout records'));
        iGrid.appendChild(createKPI('Highest OOS Product', worstProd ? worstProd.Product_ID : 'N/A', null, 'amber', '', 'package', worstProd ? `${fmtFull(worstProd.oos_count || 0)} OOS records` : ''));
        iGrid.appendChild(createKPI('Post-Launch Avail.', `${postAvail.toFixed(1)}%`, null, 'blue', '', 'activity', 'Jun–Dec 2024 average'));
    }

    const ctx1 = getCtx('chart-inv-trend');
    const trendFilt = applyDateFilter(inv.months, inv.stock_pct);

    createChart('chart-inv-trend', ctx1, {
        type: 'line',
        data: {
            labels: trendFilt.months,
            datasets: [{
                label: 'Stock Availability %',
                data: trendFilt.data,
                borderColor: COLORS.green,
                backgroundColor: COLORS.greenBg,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: { y: { min: 80, max: 100, title: { display: true, text: '%' } } }
        }
    });

    const oos = isFiltered ? inv.oos_by_product.filter(o => prods.some(p => p.Product_ID === o.product)) : inv.oos_by_product;
    const ctx2 = getCtx('chart-inv-oos');
    createChart('chart-inv-oos', ctx2, {
        type: 'bar',
        data: {
            labels: oos.map(o => o.product),
            datasets: [{
                label: 'OOS Records',
                data: oos.map(o => o.oos_count),
                backgroundColor: COLORS.red,
                borderRadius: 4
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const ctx3 = getCtx('chart-inv-cat-oos');
    if (ctx3 && inv.oos_by_category) {
        const activeCats = new Set(prods.map(p => p.category));
        const catOos = inv.oos_by_category.filter(c => activeCats.has(c.category));
        createChart('chart-inv-cat-oos', ctx3, {
            type: 'bar',
            data: {
                labels: catOos.map(c => c.category),
                datasets: [{
                    label: 'Out-of-Stock Rate %',
                    data: catOos.map(c => c.oos_rate_pct),
                    backgroundColor: [COLORS.red, COLORS.amber, COLORS.blue, COLORS.teal, COLORS.purple],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, title: { display: true, text: 'OOS Rate (%)' } } }
            }
        });
    }
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 9: REGIONAL ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

function renderRegional() {
    const scope = getFilteredDatasetScope();
    updateChartTitles(scope);

    const grid = document.getElementById('region-kpis');
    if (grid) {
        grid.innerHTML = '';
        const regColors = ['blue', 'teal', 'amber', 'green', 'purple'];
        scope.regions.labels.forEach((r, i) => {
            grid.appendChild(createKPI(r, '₹' + fmt(scope.regions.revenue[i]), null, regColors[i % regColors.length]));
        });
    }

    const ctx1 = getCtx('chart-reg-revenue');
    createChart('chart-reg-revenue', ctx1, {
        type: 'doughnut',
        data: {
            labels: scope.regions.labels,
            datasets: [{ data: scope.regions.revenue, backgroundColor: PALETTE }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    const ctx2 = getCtx('chart-reg-ba');
    createChart('chart-reg-ba', ctx2, {
        type: 'bar',
        data: {
            labels: scope.regions.labels,
            datasets: [
                { label: 'Before Launch', data: scope.regions.salesBefore, backgroundColor: COLORS.blue },
                { label: 'After Launch',  data: scope.regions.salesAfter,  backgroundColor: COLORS.teal }
            ]
        },
        options: { responsive: true }
    });

    const regHm = document.getElementById('reg-heatmap-wrapper');
    if (regHm && D.category_region_matrix) {
        const mat = D.category_region_matrix;
        const activeCats = new Set(scope.prods.map(p => p.category));
        const activeRegs = scope.activeRegions ? new Set(scope.activeRegions) : new Set(mat.regions);
        const regIndices = mat.regions.map((r, i) => activeRegs.has(r) ? i : -1).filter(i => i !== -1);
        const isDark = document.body.classList.contains('dark-theme');

        let maxVal = 1;
        mat.categories.forEach((c, ci) => {
            if (!activeCats.has(c)) return;
            regIndices.forEach(ri => {
                const v = (mat.revenue[ci][ri] || 0) * scope.segScale;
                if (v > maxVal) maxVal = v;
            });
        });

        let rHtml = '<table class="heatmap-table"><thead><tr><th class="row-head">Category</th>';
        regIndices.forEach(ri => { rHtml += `<th>${mat.regions[ri]}</th>`; });
        rHtml += '</tr></thead><tbody>';

        mat.categories.forEach((c, ci) => {
            if (!activeCats.has(c)) return;
            rHtml += `<tr><th class="row-head">${c}</th>`;
            regIndices.forEach(ri => {
                const rev = Math.round((mat.revenue[ci][ri] || 0) * scope.segScale);
                const intensity = Math.max(0.12, Math.min(0.88, rev / maxVal));
                const bg = `rgba(99, 102, 241, ${intensity.toFixed(2)})`;
                const fg = intensity > 0.45 ? '#ffffff' : (isDark ? '#e2e8f0' : '#1e293b');
                rHtml += `<td><div class="heatmap-cell" style="background:${bg};color:${fg}" title="${c} / ${mat.regions[ri]}: ₹${fmtFull(rev)}">₹${fmt(rev)}</div></td>`;
            });
            rHtml += '</tr>';
        });
        rHtml += '</tbody></table>';
        regHm.innerHTML = rHtml;
    }
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 10: RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════

function renderRecommendations(priorityFilter = 'All') {
    const grid = document.getElementById('rec-grid');
    if (!grid) return;

    const recs = D.recommendations || [];
    const highCount = recs.filter(r => r.priority === 'High').length;
    const medCount = recs.filter(r => r.priority === 'Medium').length;
    const lowCount = recs.filter(r => r.priority === 'Low').length;
    const highImpactCount = recs.filter(r => r.impact === 'High').length;

    const statsStrip = document.getElementById('recStatsStrip');
    if (statsStrip) {
        statsStrip.innerHTML = `
            <div class="rec-stat-item"><span class="rec-stat-val">${recs.length}</span><span class="rec-stat-lbl">Total Initiatives</span></div>
            <div class="rec-stat-item"><span class="rec-stat-val red">${highCount}</span><span class="rec-stat-lbl">High Priority Actions</span></div>
            <div class="rec-stat-item"><span class="rec-stat-val teal">${highImpactCount}</span><span class="rec-stat-lbl">High Impact Levers</span></div>
            <div class="rec-stat-item"><span class="rec-stat-val">${D.kpis?.cann_rate ?? 18.3}%</span><span class="rec-stat-lbl">Target Cannibalization</span></div>
        `;
    }

    const pillsWrap = document.getElementById('recFilterPills');
    if (pillsWrap && !pillsWrap.dataset.bound) {
        pillsWrap.dataset.bound = '1';
        pillsWrap.querySelectorAll('.rec-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                pillsWrap.querySelectorAll('.rec-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderRecommendations(btn.dataset.priority || 'All');
            });
        });
    }

    const iconMap = {
        'Product Strategy': 'package',
        'Pricing Strategy': 'tag',
        'Marketing Focus': 'megaphone',
        'Inventory Planning': 'archive',
        'Customer Retention': 'users',
        'Launch Strategy': 'rocket',
        'Growth Assessment': 'trending-up',
        'Regional Strategy': 'map-pin'
    };

    const horizonMap = {
        'High': 'Immediate',
        'Medium': 'Near-Term',
        'Low': 'Ongoing'
    };

    const filtered = priorityFilter === 'All' ? recs : recs.filter(r => r.priority === priorityFilter);
    grid.innerHTML = '';

    filtered.forEach((rec, idx) => {
        const pLower = (rec.priority || 'medium').toLowerCase();
        const iLower = (rec.impact || 'medium').toLowerCase();
        const iconName = iconMap[rec.area] || 'sparkles';
        const horizon = horizonMap[rec.priority] || 'Near-Term';

        const card = document.createElement('div');
        card.className = `rec-card priority-${pLower}`;
        card.innerHTML = `
            <div class="rec-card-top">
                <div class="rec-header">
                    <div class="rec-area-wrap">
                        <div class="rec-area-icon ${pLower}"><i data-lucide="${iconName}"></i></div>
                        <div>
                            <div class="rec-index">ACTION 0${idx + 1}</div>
                            <div class="rec-area">${rec.area}</div>
                        </div>
                    </div>
                    <span class="rec-priority ${pLower}">${rec.priority} Priority</span>
                </div>
                <div class="rec-text">${rec.text}</div>
            </div>
            <div class="rec-footer">
                <span class="rec-impact-badge ${iLower}">
                    <span class="impact-dot"></span> Impact: ${rec.impact}
                </span>
                <span class="rec-horizon-tag">${horizon}</span>
            </div>
        `;
        grid.appendChild(card);
    });

    if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
    }
}


// ???????????????????????????????????????????????????????????????????????
// SLICER / FILTERS LOGIC
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// SLICER / FILTERS LOGIC
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// MULTI-SELECT SLICER ENGINE
// ═══════════════════════════════════════════════════════════════════════

window.multiSelectState = {
    'filter-date': new Set(['All']),
    'filter-category': new Set(['All']),
    'filter-group': new Set(['All']),
    'filter-product': new Set(['All']),
    'filter-status': new Set(['All']),
    'filter-segment': new Set(['All']),
    'filter-price': new Set(['All']),
    'filter-region': new Set(['All'])
};

function getSlicerOptions(id) {
    if (id === 'filter-date') return ['2023', '2024'];
    if (id === 'filter-category') return (D.categories || []).map(c => c.category);
    if (id === 'filter-group') return Object.keys(D.group_trends || {});
    if (id === 'filter-product') {
        const catSet = window.multiSelectState['filter-category'] || new Set(['All']);
        const groupSet = window.multiSelectState['filter-group'] || new Set(['All']);
        const statusSet = window.multiSelectState['filter-status'] || new Set(['All']);

        return (D.products || []).filter(p => {
            if (!catSet.has('All') && catSet.size > 0 && !catSet.has(p.category)) return false;
            if (!groupSet.has('All') && groupSet.size > 0 && !groupSet.has(p.group)) return false;
            if (!statusSet.has('All') && statusSet.size > 0) {
                const isL = p.is_launched;
                let sm = false;
                if ((statusSet.has('Post-Launch') || statusSet.has('Launched')) && isL) sm = true;
                if ((statusSet.has('Pre-Launch') || statusSet.has('Existing')) && !isL) sm = true;
                if (!sm) return false;
            }
            return true;
        }).map(p => p.Product_ID);
    }
    if (id === 'filter-status') return ['Pre-Launch', 'Post-Launch'];
    if (id === 'filter-segment') return ['High Value', 'Mid Value', 'Budget'];
    if (id === 'filter-price') return ['Budget (0-50)', 'Mid (51-100)', 'Premium (101-200)', 'Luxury (201+)'];
    if (id === 'filter-region') return (D.regions || []).map(r => r.Region);
    return [];
}

function renderSlicerPopover(id) {
    const selectEl = document.getElementById(id);
    if (!selectEl) return;
    const box = selectEl.closest('.slicer-box');
    if (!box) return;

    // Trigger label container
    let trigger = box.querySelector('.slicer-trigger-text');
    if (!trigger) {
        trigger = document.createElement('div');
        trigger.className = 'slicer-trigger-text';
        box.insertBefore(trigger, selectEl);
    }
    selectEl.style.display = 'none';

    // Popover menu element
    let popover = box.querySelector('.slicer-popover-menu');
    if (!popover) {
        popover = document.createElement('div');
        popover.className = 'slicer-popover-menu';
        box.appendChild(popover);
    }

    const availableOptions = getSlicerOptions(id);
    const activeSet = window.multiSelectState[id] || new Set(['All']);
    const isAll = activeSet.has('All') || activeSet.size === 0;

    let popoverHTML = `
        <label class="slicer-option-item select-all">
            <input type="checkbox" value="All" ${isAll ? 'checked' : ''} />
            <span>Select All</span>
        </label>
        <div class="slicer-popover-divider"></div>
    `;

    availableOptions.forEach(opt => {
        const isChecked = !isAll && activeSet.has(opt);
        popoverHTML += `
            <label class="slicer-option-item">
                <input type="checkbox" value="${opt}" ${isChecked ? 'checked' : ''} />
                <span>${opt}</span>
            </label>
        `;
    });

    popover.innerHTML = popoverHTML;

    // Trigger text label formatting
    const defaultLabels = {
        'filter-date': 'All Time',
        'filter-category': 'All Categories',
        'filter-group': 'All Groups',
        'filter-product': 'All Products',
        'filter-status': 'All Status',
        'filter-segment': 'All Segments',
        'filter-price': 'All Prices',
        'filter-region': 'All Regions'
    };

    if (isAll) {
        trigger.textContent = defaultLabels[id] || 'All';
        selectEl.value = 'All';
    } else {
        const arr = Array.from(activeSet);
        selectEl.value = arr[0];
        if (arr.length === 1) {
            trigger.textContent = arr[0];
        } else if (arr.length === 2) {
            trigger.textContent = `${arr[0]}, ${arr[1]}`;
        } else {
            trigger.textContent = `${arr[0]}, ${arr[1]} (+${arr.length - 2})`;
        }
    }

    // Attach click events on checkboxes inside popover
    popover.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', (e) => {
            e.stopPropagation();
            const val = chk.value;
            if (val === 'All') {
                window.multiSelectState[id] = new Set(['All']);
            } else {
                window.multiSelectState[id].delete('All');
                if (chk.checked) {
                    window.multiSelectState[id].add(val);
                } else {
                    window.multiSelectState[id].delete(val);
                }
                if (window.multiSelectState[id].size === 0 || window.multiSelectState[id].size === availableOptions.length) {
                    window.multiSelectState[id] = new Set(['All']);
                }
            }

            renderSlicerPopover(id);

            if (['filter-category', 'filter-group', 'filter-status'].includes(id)) {
                renderSlicerPopover('filter-product');
            }

            applyFilters();
        });
    });
}

function initSlicers() {
    const filterIds = [
        'filter-date', 'filter-category', 'filter-group', 'filter-product',
        'filter-status', 'filter-segment', 'filter-price', 'filter-region'
    ];

    filterIds.forEach(id => {
        const selectEl = document.getElementById(id);
        if (!selectEl) return;
        const box = selectEl.closest('.slicer-box');
        if (!box) return;

        renderSlicerPopover(id);

        box.addEventListener('click', (e) => {
            if (e.target.closest('.slicer-popover-menu') || e.target.closest('.slicer-clear-cross')) return;
            const popover = box.querySelector('.slicer-popover-menu');
            if (!popover) return;

            const wasOpen = popover.classList.contains('open');
            document.querySelectorAll('.slicer-popover-menu').forEach(m => m.classList.remove('open'));

            if (!wasOpen) {
                renderSlicerPopover(id);
                popover.classList.add('open');
            }
        });
    });

    // Close popovers on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.slicer-box')) {
            document.querySelectorAll('.slicer-popover-menu').forEach(m => m.classList.remove('open'));
        }
    });

    // Handle Reset buttons
    const resetBtns = [document.getElementById('slicerReset'), document.getElementById('globalResetBtn')];
    resetBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                filterIds.forEach(id => {
                    window.multiSelectState[id] = new Set(['All']);
                    renderSlicerPopover(id);
                });
                const searchInput = document.getElementById('filter-search');
                if (searchInput) searchInput.value = '';
                applyFilters('all');
            });
        }
    });

    // Handle Search Input
    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
    }
}

function updateProductOptions() {
    renderSlicerPopover('filter-product');
}

function applyPreset(preset) {
    const filterIds = [
        'filter-date', 'filter-category', 'filter-group', 'filter-product',
        'filter-status', 'filter-segment', 'filter-price', 'filter-region'
    ];
    filterIds.forEach(id => window.multiSelectState[id] = new Set(['All']));

    if (preset === 'launched') {
        window.multiSelectState['filter-status'] = new Set(['Post-Launch']);
    } else if (preset === 'existing') {
        window.multiSelectState['filter-status'] = new Set(['Pre-Launch']);
    } else if (preset === 'high-value') {
        window.multiSelectState['filter-segment'] = new Set(['High Value']);
    } else if (preset === 'g1-g2') {
        window.multiSelectState['filter-group'] = new Set(['G1']);
    } else if (preset === 'ytd2024') {
        window.multiSelectState['filter-date'] = new Set(['2024']);
    }

    filterIds.forEach(id => renderSlicerPopover(id));
    applyFilters(preset);
}

function updateSlicerCardIcons() {
    const filterIds = [
        'filter-date', 'filter-category', 'filter-group', 'filter-product',
        'filter-status', 'filter-segment', 'filter-price', 'filter-region'
    ];

    filterIds.forEach(id => {
        const selectEl = document.getElementById(id);
        if (!selectEl) return;
        const box = selectEl.closest('.slicer-box');
        if (!box) return;

        const activeSet = window.multiSelectState[id] || new Set(['All']);
        const isFiltered = !activeSet.has('All') && activeSet.size > 0;

        let actionWrap = box.querySelector('.slicer-action-wrapper');
        if (!actionWrap) {
            actionWrap = document.createElement('div');
            actionWrap.className = 'slicer-action-wrapper';
            box.appendChild(actionWrap);
        }

        if (isFiltered) {
            box.classList.add('is-active');
            actionWrap.innerHTML = `<span class="slicer-clear-cross" title="Reset filter">&times;</span>`;
            const crossBtn = actionWrap.querySelector('.slicer-clear-cross');
            if (crossBtn) {
                crossBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.multiSelectState[id] = new Set(['All']);
                    renderSlicerPopover(id);
                    if (['filter-category', 'filter-group', 'filter-status'].includes(id)) {
                        renderSlicerPopover('filter-product');
                    }
                    applyFilters();
                };
            }
        } else {
            box.classList.remove('is-active');
            actionWrap.innerHTML = `<i data-lucide="chevron-down" class="slicer-arrow"></i>`;
        }
    });

    if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
    }
}

function updateFilterUI(activePreset = null) {
    updateSlicerCardIcons();
}

function isDefaultFilterState() {
    const selects = document.querySelectorAll('.slicer-select');
    for (let s of selects) {
        if (s.value !== 'All') return false;
    }
    const searchInput = document.getElementById('filter-search');
    if (searchInput && searchInput.value.trim() !== '') return false;
    return true;
}


// ═══════════════════════════════════════════════════════════════════════
// POWERBI PUBLISHED DASHBOARD FEATURES (URL Sync, PDF Export, Bookmark, Fullscreen)
// ═══════════════════════════════════════════════════════════════════════

function syncFiltersToURL() {
    const params = new URLSearchParams();
    const map = [
        ['date', 'filter-date'],
        ['category', 'filter-category'],
        ['group', 'filter-group'],
        ['product', 'filter-product'],
        ['region', 'filter-region'],
        ['status', 'filter-status'],
        ['segment', 'filter-segment'],
        ['price', 'filter-price']
    ];
    map.forEach(([paramKey, id]) => {
        const s = window.multiSelectState?.[id];
        if (s && !s.has('All') && s.size > 0) {
            params.set(paramKey, Array.from(s).join(','));
        }
    });
    const search = document.getElementById('filter-search')?.value.trim();
    if (search) params.set('search', search);

    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newURL);
}

function restoreFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;

    const map = [
        ['date', 'filter-date'],
        ['category', 'filter-category'],
        ['group', 'filter-group'],
        ['product', 'filter-product'],
        ['region', 'filter-region'],
        ['status', 'filter-status'],
        ['segment', 'filter-segment'],
        ['price', 'filter-price']
    ];
    map.forEach(([paramKey, id]) => {
        const rawVal = params.get(paramKey) || (paramKey === 'status' ? params.get('type') : null);
        if (rawVal) {
            const vals = rawVal.split(',').map(v => v.trim()).filter(Boolean);
            if (vals.length) {
                window.multiSelectState[id] = new Set(vals);
                renderSlicerPopover(id);
            }
        }
    });

    if (params.has('search')) {
        const el = document.getElementById('filter-search');
        if (el) el.value = params.get('search');
    }

    renderSlicerPopover('filter-product');
    applyFilters();
}

function showToast(msg) {
    let toast = document.getElementById('pbiToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pbiToast';
        toast.className = 'pbi-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function copyShareableLink() {
    syncFiltersToURL();
    dispatchWorkerAnalytics();
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showToast('🔗 Bookmark Link Copied to Clipboard! (URL encodes active filters)');
    }).catch(() => {
        showToast('🔗 URL updated! Copy from browser address bar.');
    });
}

function exportReportPDF() {
    showToast('📄 Preparing PowerBI Print Report...');
    setTimeout(() => {
        window.print();
    }, 400);
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            showToast('⛶ PowerBI Full-Screen Presentation Mode Active');
        }).catch(err => {
            showToast('⛶ Press F11 for Full Screen Mode');
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}


function applyFilters(preset = null) {
    const catSet = window.multiSelectState['filter-category'] || new Set(['All']);
    const groupSet = window.multiSelectState['filter-group'] || new Set(['All']);
    const statusSet = window.multiSelectState['filter-status'] || new Set(['All']);
    const prodSet = window.multiSelectState['filter-product'] || new Set(['All']);
    const dateSet = window.multiSelectState['filter-date'] || new Set(['All']);
    const regSet = window.multiSelectState['filter-region'] || new Set(['All']);
    const segSet = window.multiSelectState['filter-segment'] || new Set(['All']);
    const priceSet = window.multiSelectState['filter-price'] || new Set(['All']);
    const searchQuery = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();

    window.filterDate = Array.from(dateSet)[0] || 'All';
    window.filterRegion = Array.from(regSet)[0] || 'All';
    window.filterSegment = Array.from(segSet)[0] || 'All';
    window.filterPrice = Array.from(priceSet)[0] || 'All';
    window.filterGroup = Array.from(groupSet)[0] || 'All';
    window.filterCategory = Array.from(catSet)[0] || 'All';
    window.filterProduct = Array.from(prodSet)[0] || 'All';
    window.filterStatus = Array.from(statusSet)[0] || 'All';
    window.filterSearch = searchQuery;

    window.filteredProducts = D.products.filter(p => {
        let match = true;
        if (!catSet.has('All') && catSet.size > 0 && !catSet.has(p.category)) match = false;
        if (!groupSet.has('All') && groupSet.size > 0 && !groupSet.has(p.group)) match = false;
        if (!statusSet.has('All') && statusSet.size > 0) {
            const isL = p.is_launched;
            let sm = false;
            if ((statusSet.has('Post-Launch') || statusSet.has('Launched')) && isL) sm = true;
            if ((statusSet.has('Pre-Launch') || statusSet.has('Existing')) && !isL) sm = true;
            if (!sm) match = false;
        }
        if (!prodSet.has('All') && prodSet.size > 0 && !prodSet.has(p.Product_ID)) match = false;
        if (!priceSet.has('All') && priceSet.size > 0) {
            const band = p.price_band || (p.avg_price <= 50 ? 'Budget (0-50)' : p.avg_price <= 100 ? 'Mid (51-100)' : p.avg_price <= 200 ? 'Premium (101-200)' : 'Luxury (201+)');
            const aliasMap = { 'Low': 'Budget (0-50)', 'Medium': 'Mid (51-100)', 'High': 'Luxury (201+)' };
            const normalizedPriceSet = new Set(Array.from(priceSet).map(v => aliasMap[v] || v));
            if (!normalizedPriceSet.has(band) && !priceSet.has(band)) match = false;
        }
        if (searchQuery && !p.Product_ID.toLowerCase().includes(searchQuery) && !p.category.toLowerCase().includes(searchQuery) && !p.group.toLowerCase().includes(searchQuery)) {
            match = false;
        }
        return match;
    });

    updateFilterUI(preset);
    syncFiltersToURL();
    dispatchWorkerAnalytics();

    // Clear previously rendered pages so they re-render when navigated to
    renderedPages.clear();

    // Re-render the active page immediately
    const activeLink = document.querySelector('.nav-link.active');
    const activePage = activeLink ? activeLink.dataset.page : 'executive';
    renderPage(activePage);
}


// ═══════════════════════════════════════════════════════════════════════
// THEME LOGIC
// ═══════════════════════════════════════════════════════════════════════

function initTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    if (!document.body.classList.contains('light-theme') && !document.body.classList.contains('dark-theme')) {
        document.body.classList.add('light-theme');
    }

    let isLight = document.body.classList.contains('light-theme');
    
    Chart.defaults.color = isLight ? '#475569' : '#cbd5e1';
    Chart.defaults.borderColor = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)';
    const textSpan = toggle.querySelector('.theme-text');
    if (textSpan) textSpan.textContent = isLight ? 'Dark Mode' : 'Light Mode';

    toggle.addEventListener('click', () => {
        isLight = !isLight;
        document.body.classList.toggle('light-theme', isLight);
        document.body.classList.toggle('dark-theme', !isLight);
        
        if (textSpan) textSpan.textContent = isLight ? 'Dark Mode' : 'Light Mode';

        Chart.defaults.color = isLight ? '#475569' : '#cbd5e1';
        Chart.defaults.borderColor = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)';
        renderedPages.clear();
        renderPage(window.currentPage || 'executive');
    });
}

// ═══════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════════════
// OPENROUTER MULTI-MODEL AUTO-SWITCHING AI ENGINE
// ═══════════════════════════════════════════════════════════════════════

const OPENROUTER_API_KEY = window.OPENROUTER_API_KEY || localStorage.getItem('OPENROUTER_API_KEY') || "";

const OPENROUTER_MODELS_POOL = [
    { id: 'thinkingmachines/inkling:free', name: 'Thinking Machines: Inkling', provider: 'Thinking Machines' },
    { id: 'poolside/laguna-xs-2.1:free', name: 'Poolside: Laguna XS 2.1', provider: 'Poolside' },
    { id: 'cohere/north-mini-code:free', name: 'Cohere: North Mini Code', provider: 'Cohere' },
    { id: 'nvidia/nemotron-3.5-content-safety:free', name: 'NVIDIA: Nemotron 3.5 Content Safety', provider: 'NVIDIA' },
    { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'NVIDIA: Nemotron 3 Ultra', provider: 'NVIDIA' },
    { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', name: 'NVIDIA: Nemotron 3 Nano Omni', provider: 'NVIDIA' },
    { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google: Gemma 4 26B A4B', provider: 'Google' },
    { id: 'google/gemma-4-31b-it:free', name: 'Google: Gemma 4 31B', provider: 'Google' },
    { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'NVIDIA: Nemotron 3 Super', provider: 'NVIDIA' },
    { id: 'poolside/laguna-s-2.1:free', name: 'Poolside: Laguna S 2.1', provider: 'Poolside' },
    { id: 'thinkingmachines/inkling-small:free', name: 'Thinking Machines: Inkling Small', provider: 'Thinking Machines' },
    { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA: Nemotron 3.5 Lightning', provider: 'NVIDIA' },
    { id: 'inclusionai/ling-3.0-flash-vl:free', name: 'inclusionAI: Ling 3.0 Flash VL', provider: 'inclusionAI' },
    { id: 'nex-agi/nex-n2.5-mini:free', name: 'Nex AGI: Nex-N2.5-Mini', provider: 'Nex AGI' },
    { id: 'nex-agi/nex-n2.5-pro:free', name: 'Nex AGI: Nex-N2.5-Pro', provider: 'Nex AGI' }
];

let currentModelIndex = 0;

async function queryOpenRouterAI(userMessage, prods) {
    const totalSales = prods.reduce((sum, p) => sum + p.total_sales, 0);
    const totalRev = prods.reduce((sum, p) => sum + p.total_revenue, 0);
    const launchedCount = prods.filter(p => p.is_launched).length;
    const existingCount = prods.filter(p => !p.is_launched).length;
    const p6 = prods.find(p => p.Product_ID === 'P6');
    const p6Growth = p6 ? p6.growth_pct : -38.62;

    const datasetContext = `
Active Dataset Scope:
- Products: ${prods.length} of 25 products.
- Total Sales Volume: ${Math.round(totalSales)} units.
- Total Revenue: ₹${totalRev.toLocaleString('en-IN')}.
- Launched Products (P1-P5): ${launchedCount} products.
- Existing Products: ${existingCount} products.
- P6 Sales Growth %: ${p6Growth}%.
- Overall Cannibalization Rate: 18.3%.
`;

    const systemPrompt = `You are the P105 Executive Product Cannibalization & Market Shift AI Analyst. 
Answer the user request concisely and accurately using the live dataset scope provided. Return response in clean GitHub markdown format.
Dataset Context:
${datasetContext}`;

    const userSelect = document.getElementById('aiModelSelect');
    const selectedVal = userSelect ? userSelect.value : 'auto';
    
    let modelQueue = [...OPENROUTER_MODELS_POOL];
    if (selectedVal !== 'auto') {
        const found = OPENROUTER_MODELS_POOL.find(m => m.id === selectedVal);
        if (found) {
            modelQueue = [found, ...OPENROUTER_MODELS_POOL.filter(m => m.id !== selectedVal)];
        }
    }

    for (let attempts = 0; attempts < modelQueue.length; attempts++) {
        const targetModel = modelQueue[attempts];
        

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'P105 Product Cannibalization Analytics Dashboard',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: targetModel.id,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ],
                    temperature: 0.3,
                    max_tokens: 600
                })
            });

            if (!response.ok) {
                console.warn(`⚠️ OpenRouter Model ${targetModel.name} returned status ${response.status}. Auto-switching to next model in pool...`);
                continue;
            }

            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                currentModelIndex = OPENROUTER_MODELS_POOL.indexOf(targetModel);
                const aiResponseText = data.choices[0].message.content;
                const modelBadgeText = attempts > 0 
                    ? `🔄 Auto-Switched to ${targetModel.name} (${targetModel.provider})` 
                    : `✨ Powered by ${targetModel.name} (${targetModel.provider})`;

                return {
                    text: aiResponseText,
                    badge: modelBadgeText,
                    modelName: targetModel.name
                };
            }
        } catch (err) {
            console.warn(`⚠️ Error reaching ${targetModel.name}:`, err);
            continue;
        }
    }

    const fallbackText = processAIQuery(userMessage);
    return {
        text: fallbackText,
        badge: '⚡ Offline Smart Analytics (OpenRouter pool busy)',
        modelName: 'Offline Rules Engine'
    };
}


// ═══════════════════════════════════════════════════════════════════════
// AI COPILOT & SMART NARRATIVE ENGINE
// ═══════════════════════════════════════════════════════════════════════

function generateAINarrative(prods) {
    const total = prods.length;
    const totalSales = prods.reduce((sum, p) => sum + p.total_sales, 0);
    const totalRev = prods.reduce((sum, p) => sum + p.total_revenue, 0);
    const avgPrice = totalSales ? totalRev / totalSales : 0;
    
    const launchedProds = prods.filter(p => p.is_launched);
    const existingProds = prods.filter(p => !p.is_launched);
    
    const p6 = prods.find(p => p.Product_ID === 'P6');
    const p6Drop = p6 ? p6.growth_pct : null;

    let narrative = `🤖 <strong>AI Scope Analysis (${total} of ${D.products.length} Products Selected):</strong><br/>`;
    
    narrative += `• Total volume in scope is <strong>${fmtFull(Math.round(totalSales))} units</strong> yielding <strong>₹${fmt(totalRev)}</strong> total revenue (weighted avg unit price ₹${avgPrice.toFixed(2)}).<br/>`;

    if (launchedProds.length > 0 && existingProds.length > 0) {
        const launchRev = launchedProds.reduce((sum, p) => sum + p.total_revenue, 0);
        const launchPct = ((launchRev / totalRev) * 100).toFixed(1);
        narrative += `• Newly launched lines (P1–P5) contribute <strong>₹${fmt(launchRev)} (${launchPct}%)</strong> to active scope revenue following the June 2024 launch.<br/>`;
    } else if (launchedProds.length > 0) {
        narrative += `• Active filter isolates <strong>Newly Launched Products (P1–P5)</strong>. Post-launch adoption is strong with 89.4% retention and average rating 4.0/5.<br/>`;
    } else if (existingProds.length > 0) {
        narrative += `• Active filter isolates <strong>Existing Product Portfolio</strong>. Legacy products show expected volume shifts following June 2024 product line introductions.<br/>`;
    }

    if (p6Drop !== null && p6Drop < 0) {
        narrative += `• <strong>Cannibalization Alert:</strong> Legacy product <strong>P6</strong> experienced a <strong>${Math.abs(p6Drop).toFixed(1)}% sales volume drop</strong> after June 2024 due to customer migration towards new line variants P4 & P5.<br/>`;
    }

    const catTotals = {};
    prods.forEach(p => {
        catTotals[p.category] = (catTotals[p.category] || 0) + p.total_revenue;
    });
    const topCat = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a])[0];
    if (topCat) {
        narrative += `• <strong>Category Leader:</strong> <strong>${topCat}</strong> generates highest revenue within active filter scope (₹${fmt(catTotals[topCat])}).`;
    }

    return narrative;
}

function processAIQuery(query) {
    const q = query.toLowerCase();
    const prods = window.filteredProducts || D.products;
    
    if (q.includes('p6') || q.includes('cannibaliz')) {
        return `📉 <strong>P6 Cannibalization Analysis:</strong><br/>Following the June 2024 launch of P4 and P5, Product P6 lost 7,533 sales units (-38.6% drop). 230 customer accounts switched directly to P4/P5, while 114 stayed with P6 and 1,202 churned. Overall portfolio cannibalization rate stands at 18.3%.`;
    }
    
    if (q.includes('launch') || q.includes('p1') || q.includes('new')) {
        const launched = D.products.filter(p => p.is_launched);
        const totalSales = launched.reduce((s, p) => s + p.total_sales, 0);
        const totalRev = launched.reduce((s, p) => s + p.total_revenue, 0);
        return `🚀 <strong>Newly Launched Products (P1–P5) Overview:</strong><br/>Launched in June 2024 across Household (P1), Dairy (P2, P4, P5), and Personal Care (P3). Combined sales total <strong>${fmtFull(totalSales)} units</strong> (₹${fmt(totalRev)} revenue), successfully expanding net portfolio market share by +14.9%.`;
    }

    if (q.includes('category') || q.includes('top') || q.includes('highest')) {
        return `💰 <strong>Category Performance Breakdown:</strong><br/>1. <strong>Household:</strong> ₹84.77M (51.2% total revenue)<br/>2. <strong>Personal Care:</strong> ₹42.82M (25.9%)<br/>3. <strong>Beverages:</strong> ₹15.88M (9.6%)<br/>4. <strong>Dairy:</strong> ₹15.76M (9.5%)<br/>5. <strong>Snacks:</strong> ₹6.35M (3.8%)`;
    }

    if (q.includes('recommend') || q.includes('strategy') || q.includes('action')) {
        return `🎯 <strong>AI Strategic Recommendations:</strong><br/>1. <strong>Reposition P6:</strong> Re-align P6 pricing (₹60.13) to target budget segment and reduce direct competition with P4/P5.<br/>2. <strong>Capitalize on P1/P3 Growth:</strong> Increase marketing allocation for High-ROI lines P1 (2.63x) and P20 (2.72x).<br/>3. <strong>OOS Mitigation:</strong> Resolve stockouts on P12 and P13 (250+ OOS events) to capture ~₹1.2M unfulfilled demand.`;
    }

    const narrative = generateAINarrative(prods);
    return `🤖 <strong>AI Analytics Response for "${query}":</strong><br/>${narrative}`;
}

function initAIEngine() {
    const aiBtn = document.getElementById('aiInsightsBtn');
    const aiModal = document.getElementById('aiModal');
    const aiClose = document.getElementById('aiModalClose');
    const aiOverlay = document.getElementById('aiModalOverlay');
    const sendBtn = document.getElementById('aiChatSendBtn');
    const chatInput = document.getElementById('aiChatInput');
    const chatHistory = document.getElementById('aiChatHistory');

    function openAI() {
        if (!aiModal) return;
        aiModal.classList.add('active');
        const prods = window.filteredProducts || D.products;
        const narrativeBox = document.getElementById('aiModalNarrative');
        if (narrativeBox) narrativeBox.innerHTML = generateAINarrative(prods);
    }

    function closeAI() {
        if (aiModal) aiModal.classList.remove('active');
    }

    if (aiBtn) aiBtn.addEventListener('click', openAI);
    if (aiClose) aiClose.addEventListener('click', closeAI);
    if (aiOverlay) aiOverlay.addEventListener('click', closeAI);

    document.querySelectorAll('.ai-prompt-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.dataset.query;
            handleUserMessage(query);
        });
    });

    async function handleUserMessage(msgText) {
        if (!msgText.trim()) return;

        const userDiv = document.createElement('div');
        userDiv.className = 'ai-msg ai-msg-user';
        userDiv.innerHTML = `<div class="ai-msg-bubble">${msgText}</div>`;
        chatHistory.appendChild(userDiv);

        if (chatInput) chatInput.value = '';

        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-msg ai-msg-system ai-loading-msg';
        loadingDiv.innerHTML = `<i data-lucide="sparkles" class="ai-msg-icon ai-spin"></i><div class="ai-msg-bubble">🤖 OpenRouter AI Copilot is thinking... (Auto-switching model pool if token limit hit)</div>`;
        chatHistory.appendChild(loadingDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        if (window.lucide) window.lucide.createIcons();

        const prods = window.filteredProducts || D.products;
        const res = await queryOpenRouterAI(msgText, prods);

        loadingDiv.remove();

        const botDiv = document.createElement('div');
        botDiv.className = 'ai-msg ai-msg-system';
        botDiv.innerHTML = `<i data-lucide="bot" class="ai-msg-icon"></i><div class="ai-msg-bubble"><div class="ai-model-tag">${res.badge}</div>${res.text.replace(/\n/g, '<br/>')}</div>`;
        chatHistory.appendChild(botDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        const badgeEl = document.getElementById('aiModelBadge');
        if (badgeEl) badgeEl.textContent = res.badge;

        if (window.lucide) window.lucide.createIcons();
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            if (chatInput) handleUserMessage(chatInput.value);
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserMessage(chatInput.value);
        });
    }
}



// ═══════════════════════════════════════════════════════════════════════
// POWERBI VERTIPAQ WEB WORKER BACKGROUND ENGINE INTEGRATION
// ═══════════════════════════════════════════════════════════════════════

let pbiWorker = null;
let scheduledSyncTimer = null;
let syncCountdown = 30;

function initPBIBackgroundEngine() {
    try {
        pbiWorker = new Worker('pbi-background-engine.js');
        pbiWorker.onmessage = function(e) {
            const { status, durationMs, processedRecords, anomalies } = e.data;
            if (status === 'COMPLETED') {
                const timeEl = document.getElementById('pbiCalcTime');
                if (timeEl) timeEl.textContent = `Background Calc: ${durationMs}ms`;

                const rowEl = document.getElementById('pbiProcessedRows');
                if (rowEl) rowEl.textContent = `Processed: ${fmtFull(processedRecords)} Records`;
            }
        };
        console.log('⚡ PowerBI VertiPaq Web Worker Background Engine Initialized.');
    } catch (err) {
        console.warn('⚠️ Web Worker initialization fallback:', err);
    }

    // Scheduled Ingestion Ticker (30s background sync)
    if (!scheduledSyncTimer) {
        scheduledSyncTimer = setInterval(() => {
            syncCountdown--;
            if (syncCountdown <= 0) {
                syncCountdown = 30;
                dispatchWorkerAnalytics();
            }
            const syncEl = document.getElementById('pbiSyncStatus');
            if (syncEl) syncEl.textContent = `Gateway Pipeline: Live (Next sync: ${syncCountdown}s)`;
        }, 1000);
    }
}

function dispatchWorkerAnalytics() {
    if (!pbiWorker) return;
    const prods = window.filteredProducts || D.products;
    const filters = {
        date: window.filterDate,
        region: window.filterRegion,
        segment: window.filterSegment,
        price: window.filterPrice
    };
    pbiWorker.postMessage({
        action: 'PROCESS_ANALYTICS',
        payload: { prods, filters, D }
    });
}


const DOC_BASE_URL = "https://docs.google.com/gview?url=https://raw.githubusercontent.com/Harry-0402/P105-Product-Cannibalization-/main/";
const DOC_RAW_URL = "https://raw.githubusercontent.com/Harry-0402/P105-Product-Cannibalization-/main/";
const DOC_END_URL = "&embedded=true";

function loadDocPreview(docName) {
    if (!docName) return;
    const docIframe = document.getElementById('docIframe');
    const docDownloadBtn = document.getElementById('docDownloadBtn');
    const cacheBuster = "%3Fv%3D" + new Date().getTime();
    if (docIframe) {
        docIframe.src = DOC_BASE_URL + docName + cacheBuster + DOC_END_URL;
    }
    if (docDownloadBtn) {
        docDownloadBtn.href = DOC_RAW_URL + docName;
    }
}

function openDocModal(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('docModal');
    if (modal) {
        modal.classList.add('active');
        const activeBtn = modal.querySelector('.doc-btn.active') || modal.querySelector('.doc-btn');
        if (activeBtn) loadDocPreview(activeBtn.getAttribute('data-doc'));
    }
}

function initDocModalListeners() {
    const docModal = document.getElementById('docModal');
    const docModalClose = document.getElementById('docModalClose');
    const docIframe = document.getElementById('docIframe');
    const docBtns = document.querySelectorAll('.doc-btn');

    if (docModalClose) {
        docModalClose.addEventListener('click', () => {
            if (docModal) docModal.classList.remove('active');
        });
    }

    window.addEventListener('click', (e) => {
        if (docModal && e.target === docModal) {
            docModal.classList.remove('active');
        }
    });

    if (docBtns && docBtns.length) {
        docBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                docBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadDocPreview(btn.getAttribute('data-doc'));
            });
        });
    }

    const docRefreshBtn = document.getElementById('docRefreshBtn');
    if (docRefreshBtn) {
        docRefreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (docIframe) docIframe.src = '';
            setTimeout(() => {
                const activeBtn = document.querySelector('.doc-btn.active') || document.querySelector('.doc-btn');
                if (activeBtn) loadDocPreview(activeBtn.getAttribute('data-doc'));
            }, 100);
        });
    }
}


window.__activeDockBtnId = 'themeToggle';

function setDockFocus(targetId) {
    const dock = document.getElementById('sidebarActionDock');
    if (!dock) return;
    dock.querySelectorAll('.dock-btn').forEach(btn => {
        btn.classList.toggle('is-expanded', btn.id === targetId);
    });
}

function initSidebarActionDock() {
    const dock = document.getElementById('sidebarActionDock');
    if (!dock) return;
    const dockOrder = ['themeToggle', 'sidebarRepoBtn', 'sidebarCreatorBtn'];
    let dockIdx = 0;
    let dockPaused = false;

    const btns = dock.querySelectorAll('.dock-btn');
    btns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            dockPaused = true;
            setDockFocus(btn.id);
        });
        btn.addEventListener('focus', () => {
            dockPaused = true;
            setDockFocus(btn.id);
        });
        btn.addEventListener('click', () => {
            window.__activeDockBtnId = btn.id;
            const foundIdx = dockOrder.indexOf(btn.id);
            if (foundIdx !== -1) dockIdx = foundIdx;
            setDockFocus(btn.id);
        });
    });

    dock.addEventListener('mouseleave', () => {
        dockPaused = false;
        setDockFocus(window.__activeDockBtnId || dockOrder[dockIdx]);
    });
    dock.addEventListener('focusout', () => {
        dockPaused = false;
    });

    if (!window.__dockAutoTimer) {
        window.__dockAutoTimer = setInterval(() => {
            if (dockPaused) return;
            dockIdx = (dockIdx + 1) % dockOrder.length;
            window.__activeDockBtnId = dockOrder[dockIdx];
            setDockFocus(dockOrder[dockIdx]);
        }, 3200);
    }
}

function bootApp() {
    if (window.__p105Booted) return;
    window.__p105Booted = true;
    try {
        window.currentPage = window.currentPage || 'executive';
        initTheme();
        initSidebarActionDock();
        initSlicers();
        restoreFiltersFromURL();
        initPBIBackgroundEngine();
        initAIEngine();
        initDocModalListeners();
        updateFilterHubPageHeader(window.currentPage);
        renderPage(window.currentPage);
        if (window.lucide && window.lucide.createIcons) {
            window.lucide.createIcons();
        }
    } catch (err) {
        console.error('BootApp Initialization Error:', err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
} else {
    bootApp();
}

window.addEventListener('load', () => {
    if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
    }
});
