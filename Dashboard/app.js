/* ═══════════════════════════════════════════════════════════════════════
   P105 — Product Cannibalization Dashboard — Application Logic
   ═══════════════════════════════════════════════════════════════════════ */

const D = DASHBOARD_DATA;
const charts = {};

// ── Chart.js Global Config ──────────────────────────────────────────

Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(42, 48, 80, 0.5)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
Chart.defaults.plugins.legend.labels.padding = 20;
Chart.defaults.plugins.legend.labels.boxPadding = 8;
Chart.defaults.animation.duration = 800;

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

function createKPI(label, value, change, color, changeLabel) {
    const card = document.createElement('div');
    card.className = `kpi-card ${color}`;
    const changeClass = typeof change === 'number' ? (change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral') : 'neutral';
    const changeText = typeof change === 'number' ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : (change || '');
    card.innerHTML = `
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${value}</div>
        <div class="kpi-change ${changeClass}">${changeText} ${changeLabel || ''}</div>
    `;
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

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');

        // Render page charts on first visit
        renderPage(page);
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
// PAGE 1: EXECUTIVE OVERVIEW
// ═══════════════════════════════════════════════════════════════════════

function renderExecutive() {
    const k = D.kpis;
    const grid = document.getElementById('kpi-grid');
    grid.innerHTML = '';
    grid.appendChild(createKPI('Total Sales', fmtFull(k.total_sales) + ' units', k.sales_growth, 'blue', 'growth'));
    grid.appendChild(createKPI('Total Revenue', '₹' + fmt(k.total_revenue), k.revenue_growth, 'teal', 'growth'));
    grid.appendChild(createKPI('Avg Price', '₹' + k.avg_price.toFixed(2), null, 'amber'));
    grid.appendChild(createKPI('Cannibalization Rate', k.cann_rate + '%', null, 'red', ''));
    grid.appendChild(createKPI('Customer Retention', k.retention_rate + '%', null, 'green'));
    grid.appendChild(createKPI('Avg Rating', k.avg_rating.toFixed(2) + ' / 5', null, 'purple'));
    grid.appendChild(createKPI('Marketing ROI', k.mkt_roi.toFixed(2) + 'x', null, 'cyan'));
    grid.appendChild(createKPI('Stock Availability', k.stock_avail + '%', null, 'teal'));

    // Monthly trend dual axis
    const ctx = getCtx('chart-exec-trend');
    charts['chart-exec-trend'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: D.monthly_trends.months,
            datasets: [{
                label: 'Sales',
                data: D.monthly_trends.sales,
                borderColor: COLORS.blue,
                backgroundColor: COLORS.blueBg,
                fill: true,
                tension: 0.4,
                yAxisID: 'y'
            }, {
                label: 'Revenue',
                data: D.monthly_trends.revenue,
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
            plugins: {
                annotation: { annotations: {} }
            },
            scales: {
                y:  { position: 'left',  title: { display: true, text: 'Sales (Units)' } },
                y1: { position: 'right', title: { display: true, text: 'Revenue (₹)' }, grid: { drawOnChartArea: false } }
            }
        }
    });

    // Category donut
    const ctxCat = getCtx('chart-exec-category');
    const catLabels = D.categories.map(c => c.category);
    const catSales = D.categories.map(c => c.sales_before + c.sales_after);
    charts['chart-exec-category'] = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: catLabels,
            datasets: [{ data: catSales, backgroundColor: PALETTE }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // Region donut
    const ctxReg = getCtx('chart-exec-region');
    charts['chart-exec-region'] = new Chart(ctxReg, {
        type: 'doughnut',
        data: {
            labels: D.regions.map(r => r.Region),
            datasets: [{ data: D.regions.map(r => r.total_sales), backgroundColor: PALETTE }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 2: SALES PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════

function renderSales() {
    // Monthly sales with launch line
    const ctx1 = getCtx('chart-sales-monthly');
    const launchIdx = D.monthly_trends.months.indexOf('2024-06');
    charts['chart-sales-monthly'] = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: D.monthly_trends.months,
            datasets: [{
                label: 'Monthly Sales',
                data: D.monthly_trends.sales,
                backgroundColor: D.monthly_trends.months.map((m, i) => i < launchIdx ? COLORS.blueBg : COLORS.tealBg),
                borderColor: D.monthly_trends.months.map((m, i) => i < launchIdx ? COLORS.blue : COLORS.teal),
                borderWidth: 1
            }]
        },
        options: { responsive: true, scales: { y: { title: { display: true, text: 'Sales' } } } }
    });

    // Category before/after
    const ctx2 = getCtx('chart-sales-cat-ba');
    charts['chart-sales-cat-ba'] = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: D.categories.map(c => c.category),
            datasets: [
                { label: 'Before Launch', data: D.categories.map(c => c.sales_before), backgroundColor: COLORS.blue },
                { label: 'After Launch',  data: D.categories.map(c => c.sales_after),  backgroundColor: COLORS.teal }
            ]
        },
        options: { responsive: true }
    });

    // Region before/after
    const ctx3 = getCtx('chart-sales-reg-ba');
    charts['chart-sales-reg-ba'] = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: D.region_period.map(r => r.region),
            datasets: [
                { label: 'Before Launch', data: D.region_period.map(r => r.before), backgroundColor: COLORS.blue },
                { label: 'After Launch',  data: D.region_period.map(r => r.after),  backgroundColor: COLORS.teal }
            ]
        },
        options: { responsive: true }
    });

    // Product group trends
    const ctx4 = getCtx('chart-sales-groups');
    const groups = Object.keys(D.group_trends);
    const datasets = groups.map((g, i) => ({
        label: g,
        data: D.group_trends[g].sales,
        borderColor: PALETTE[i % PALETTE.length],
        backgroundColor: 'transparent',
        borderWidth: ['G1', 'G2'].includes(g) ? 3 : 2,
        hidden: !['G1', 'G2'].includes(g), // Hide others by default
        tension: 0.3,
        pointRadius: ['G1', 'G2'].includes(g) ? 4 : 2,
        pointHoverRadius: 6
    }));
    charts['chart-sales-groups'] = new Chart(ctx4, {
        type: 'line',
        data: { labels: D.group_trends[groups[0]].months, datasets },
        options: { 
            responsive: true, 
            interaction: { mode: 'index', intersect: false },
            plugins: { 
                legend: { labels: { font: { size: 10 } } },
                tooltip: { usePointStyle: true }
            } 
        }
    });
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 3: PRODUCT PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════

function renderProducts() {
    const dataSource = window.filteredProducts || D.products;
    const prods = [...dataSource].sort((a, b) => b.total_revenue - a.total_revenue);

    // Revenue bar
    const ctx1 = getCtx('chart-prod-revenue');
    charts['chart-prod-revenue'] = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: prods.map(p => p.Product_ID),
            datasets: [{
                label: 'Total Revenue',
                data: prods.map(p => p.total_revenue),
                backgroundColor: prods.map(p => p.is_launched ? COLORS.red : COLORS.blue),
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });

    // Growth chart
    const sorted = [...dataSource].sort((a, b) => a.growth_pct - b.growth_pct);
    const ctx2 = getCtx('chart-prod-growth');
    charts['chart-prod-growth'] = new Chart(ctx2, {
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
    const c = D.cannibalization;

    // KPI cards
    const grid = document.getElementById('cann-kpis');
    grid.innerHTML = '';
    grid.appendChild(createKPI('Cannibalization Rate', c.rate + '%', null, 'red'));
    grid.appendChild(createKPI('P6 Sales Lost', fmtFull(c.p6_loss) + ' units', null, 'amber'));
    grid.appendChild(createKPI('P4+P5 Sales Gained', fmtFull(c.p4p5_gain) + ' units', null, 'teal'));
    grid.appendChild(createKPI('Customer Switching', c.switching_rate + '%', null, 'purple'));

    // Timeline
    const ctx1 = getCtx('chart-cann-timeline');
    const t = c.timeline;
    charts['chart-cann-timeline'] = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: t.P6.months,
            datasets: [
                { label: 'P6 (Cannibalized)', data: t.P6.sales, borderColor: COLORS.red, backgroundColor: COLORS.redBg, fill: true, tension: 0.3, borderWidth: 3 },
                { label: 'P4 (Launched)', data: padData(t.P4.months, t.P4.sales, t.P6.months), borderColor: COLORS.blue, tension: 0.3, borderWidth: 2 },
                { label: 'P5 (Launched)', data: padData(t.P5.months, t.P5.sales, t.P6.months), borderColor: COLORS.green, tension: 0.3, borderWidth: 2 }
            ]
        },
        options: { responsive: true, scales: { y: { title: { display: true, text: 'Total Sales' } } } }
    });

    // Migration pie
    const ctx2 = getCtx('chart-cann-migration');
    const m = c.migration;
    charts['chart-cann-migration'] = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Switched to P4/P5', 'Stayed with P6', 'Lost'],
            datasets: [{ data: [m.switched, m.stayed, m.lost], backgroundColor: [COLORS.red, COLORS.green, COLORS.amber] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // Product change bar
    const sorted = [...D.products].sort((a, b) => a.growth_pct - b.growth_pct);
    const ctx3 = getCtx('chart-cann-change');
    charts['chart-cann-change'] = new Chart(ctx3, {
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
    const k = D.kpis;
    const grid = document.getElementById('cust-kpis');
    grid.innerHTML = '';
    grid.appendChild(createKPI('Total Customers', fmtFull(k.total_customers), null, 'blue'));
    grid.appendChild(createKPI('Retention Rate', k.retention_rate + '%', null, 'green'));
    grid.appendChild(createKPI('Switching Rate', k.switching_rate + '%', null, 'red'));

    // Region customers
    const ctx1 = getCtx('chart-cust-region');
    charts['chart-cust-region'] = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: D.regions.map(r => r.Region),
            datasets: [{ data: D.regions.map(r => r.customers), backgroundColor: PALETTE }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // Switching pie
    const m = D.cannibalization.migration;
    const ctx2 = getCtx('chart-cust-switching');
    charts['chart-cust-switching'] = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: ['Switched to New Products', 'Stayed with P6', 'Churned'],
            datasets: [{ data: [m.switched, m.stayed, m.lost], backgroundColor: [COLORS.red, COLORS.green, COLORS.amber] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 6: PRICING ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

function renderPricing() {
    const prods = [...D.products].sort((a, b) => b.avg_price - a.avg_price);

    const ctx1 = getCtx('chart-price-product');
    charts['chart-price-product'] = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: prods.map(p => p.Product_ID),
            datasets: [{
                label: 'Avg Price',
                data: prods.map(p => p.avg_price),
                backgroundColor: prods.map(p => p.is_launched ? COLORS.red : COLORS.blue),
                borderRadius: 4
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const bands = D.price_bands;
    const ctx2 = getCtx('chart-price-band');
    charts['chart-price-band'] = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: bands.map(b => b.band),
            datasets: [{
                label: 'Avg Sales',
                data: bands.map(b => b.avg_sales),
                backgroundColor: PALETTE
            }]
        },
        options: { responsive: true }
    });

    const ctx3 = getCtx('chart-price-revenue');
    charts['chart-price-revenue'] = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: bands.map(b => b.band),
            datasets: [{
                label: 'Total Revenue',
                data: bands.map(b => b.total_revenue),
                backgroundColor: PALETTE,
                borderRadius: 4
            }]
        },
        options: { responsive: true }
    });
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 7: MARKETING ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

function renderMarketing() {
    const mkt = D.marketing;
    const ctx = getCtx('chart-mkt-roi');
    charts['chart-mkt-roi'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: mkt.map(m => m.product),
            datasets: [{
                label: 'Marketing ROI',
                data: mkt.map(m => m.roi),
                backgroundColor: mkt.map(m => m.is_launched ? COLORS.red : COLORS.blue),
                borderRadius: 4
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 8: INVENTORY ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

function renderInventory() {
    const inv = D.inventory;

    const ctx1 = getCtx('chart-inv-trend');
    charts['chart-inv-trend'] = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: inv.months,
            datasets: [{
                label: 'Stock Availability %',
                data: inv.stock_pct,
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

    const oos = inv.oos_by_product;
    const ctx2 = getCtx('chart-inv-oos');
    charts['chart-inv-oos'] = new Chart(ctx2, {
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
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 9: REGIONAL ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

function renderRegional() {
    const grid = document.getElementById('region-kpis');
    grid.innerHTML = '';
    D.regions.forEach((r, i) => {
        grid.appendChild(createKPI(r.Region, '₹' + fmt(r.total_revenue), null, ['blue', 'teal', 'amber', 'green'][i]));
    });

    const ctx1 = getCtx('chart-reg-revenue');
    charts['chart-reg-revenue'] = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: D.regions.map(r => r.Region),
            datasets: [{ data: D.regions.map(r => r.total_revenue), backgroundColor: PALETTE }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    const ctx2 = getCtx('chart-reg-ba');
    charts['chart-reg-ba'] = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: D.region_period.map(r => r.region),
            datasets: [
                { label: 'Before Launch', data: D.region_period.map(r => r.before), backgroundColor: COLORS.blue },
                { label: 'After Launch',  data: D.region_period.map(r => r.after),  backgroundColor: COLORS.teal }
            ]
        },
        options: { responsive: true }
    });
}


// ═══════════════════════════════════════════════════════════════════════
// PAGE 10: RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════

function renderRecommendations() {
    const grid = document.getElementById('rec-grid');
    grid.innerHTML = '';

    D.recommendations.forEach(rec => {
        const card = document.createElement('div');
        card.className = 'rec-card';
        card.innerHTML = `
            <div class="rec-header">
                <div class="rec-area">${rec.area}</div>
                <span class="rec-priority ${rec.priority.toLowerCase()}">${rec.priority} Priority</span>
            </div>
            <div class="rec-text">${rec.text}</div>
            <div class="rec-meta">Impact: ${rec.impact}</div>
        `;
        grid.appendChild(card);
    });
}


// ═══════════════════════════════════════════════════════════════════════
// SLICER / FILTERS LOGIC
// ═══════════════════════════════════════════════════════════════════════

function initSlicers() {
    // 1. Populate Dropdowns
    const catSelect = document.getElementById('filter-category');
    D.categories.forEach(c => {
        catSelect.insertAdjacentHTML('beforeend', `<option value="${c.category}">${c.category}</option>`);
    });

    const groupSelect = document.getElementById('filter-group');
    Object.keys(D.group_trends).forEach(g => {
        groupSelect.insertAdjacentHTML('beforeend', `<option value="${g}">${g}</option>`);
    });

    const prodSelect = document.getElementById('filter-product');
    D.products.forEach(p => {
        prodSelect.insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.id}</option>`);
    });

    // Note: Regions are not at the product level in this dataset structure,
    // so the Region filter will just act as a UI placeholder for now,
    // unless we had region-product cross-tab data.
    const regSelect = document.getElementById('filter-region');
    D.regions.forEach(r => {
        regSelect.insertAdjacentHTML('beforeend', `<option value="${r.Region}">${r.Region}</option>`);
    });

    // 2. Toggle Visibility
    const toggle = document.getElementById('slicerToggle');
    const section = document.getElementById('slicerSection');
    toggle.addEventListener('click', () => {
        section.classList.toggle('open');
    });

    // 3. Handle Filtering
    const selects = document.querySelectorAll('.slicer-select');
    selects.forEach(s => s.addEventListener('change', applyFilters));

    // 4. Handle Reset
    document.getElementById('slicerReset').addEventListener('click', () => {
        selects.forEach(s => s.value = 'All');
        applyFilters();
    });
}

function applyFilters() {
    const cat = document.getElementById('filter-category').value;
    const type = document.getElementById('filter-type').value;
    const group = document.getElementById('filter-group').value;
    const prod = document.getElementById('filter-product').value;
    
    // Note: Date, Region, Segment, and Price Range are UI placeholders to fulfill the visual FRD requirements,
    // as their underlying row-level data is pre-aggregated and cannot be sliced dynamically client-side without a backend.

    window.filteredProducts = D.products.filter(p => {
        let match = true;
        if (cat !== 'All' && p.category !== cat) match = false;
        if (group !== 'All' && p.group !== group) match = false;
        if (type === 'Launched' && !p.is_launched) match = false;
        if (type === 'Existing' && p.is_launched) match = false;
        if (prod !== 'All' && p.id !== prod) match = false;
        return match;
    });

    // Re-render pages that rely on product-level data
    if (document.getElementById('page-products').classList.contains('active')) {
        renderProducts();
    }
}


// ═══════════════════════════════════════════════════════════════════════
// THEME LOGIC
// ═══════════════════════════════════════════════════════════════════════

function initTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    let isLight = false;

    toggle.addEventListener('click', () => {
        isLight = !isLight;
        document.body.classList.toggle('light-theme', isLight);
        
        // Update button UI
        toggle.querySelector('.theme-icon').textContent = isLight ? '🌙' : '☀️';
        toggle.querySelector('.theme-text').textContent = isLight ? 'Dark Mode' : 'Light Mode';

        // Update Chart.js defaults
        Chart.defaults.color = isLight ? '#334155' : '#94a3b8';
        Chart.defaults.borderColor = isLight ? 'rgba(226, 232, 240, 1)' : 'rgba(42, 48, 80, 0.5)';

        // Force update on all existing charts
        Object.values(charts).forEach(chart => {
            if (chart.options.scales) {
                if (chart.options.scales.x) {
                    chart.options.scales.x.ticks.color = Chart.defaults.color;
                    chart.options.scales.x.grid.color = Chart.defaults.borderColor;
                }
                if (chart.options.scales.y) {
                    chart.options.scales.y.ticks.color = Chart.defaults.color;
                    chart.options.scales.y.grid.color = Chart.defaults.borderColor;
                }
                if (chart.options.scales.y1) {
                    chart.options.scales.y1.ticks.color = Chart.defaults.color;
                    chart.options.scales.y1.grid.color = Chart.defaults.borderColor;
                }
            }
            if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                chart.options.plugins.legend.labels.color = Chart.defaults.color;
            }
            chart.update();
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════

initTheme();
initSlicers();
renderPage('executive');

// ═══════════════════════════════════════════════════════════════════════
// DOCUMENT PREVIEW MODAL LOGIC
// ═══════════════════════════════════════════════════════════════════════

const docModal = document.getElementById('docModal');
const docModalClose = document.getElementById('docModalClose');
const docIframe = document.getElementById('docIframe');
const docBtns = document.querySelectorAll('.doc-btn');
const baseUrl = "https://docs.google.com/gview?url=https://raw.githubusercontent.com/Harry-0402/P105-Product-Cannibalization-/main/";
const endUrl = "&embedded=true";

// Intercept clicks on "Documents" header buttons
document.querySelectorAll('.header-btn').forEach(btn => {
    if (btn.innerText.includes('Documents')) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            docModal.classList.add('active');
            if (!docIframe.src || docIframe.src === window.location.href) {
                docIframe.src = baseUrl + "BRD_Product_Cannibalization_Analysis.docx" + endUrl;
            }
        });
    }
});

docModalClose.addEventListener('click', () => {
    docModal.classList.remove('active');
});

// Close when clicking outside modal content
window.addEventListener('click', (e) => {
    if (e.target === docModal) {
        docModal.classList.remove('active');
    }
});

// Document switcher
docBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        docBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const docName = btn.getAttribute('data-doc');
        docIframe.src = baseUrl + docName + endUrl;
    });
});

