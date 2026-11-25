"""
Generate pre-aggregated data for the HTML dashboard.
Reads the cleaned CSV and outputs a JavaScript data file (data.js).
"""

import pandas as pd
import numpy as np
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE, 'Data')
DASH_DIR = os.path.join(BASE, 'Dashboard')
os.makedirs(DASH_DIR, exist_ok=True)

LAUNCH_DATE = pd.Timestamp('2024-06-01')
LAUNCHED_PRODUCTS = ['P1', 'P2', 'P3', 'P4', 'P5']
AFFECTED_GROUPS = ['G1', 'G2']

print("Generating dashboard data...")

# ── Load Data ──
df = pd.read_csv(os.path.join(DATA_DIR, 'cannibalization_cleaned.csv'))
df['Date'] = pd.to_datetime(df['Date'])
before = df[df['Period_Flag'] == 'Before_Launch']
after  = df[df['Period_Flag'] == 'After_Launch']

data = {}

# ═══════════════════════════════════════════════════════════════════════════════
# 1. KPI Cards
# ═══════════════════════════════════════════════════════════════════════════════

months_before = before['Year_Month'].nunique()
months_after  = after['Year_Month'].nunique()

p6_b = before[before['Product_ID'] == 'P6']['Sales'].sum()
p6_a = after[after['Product_ID'] == 'P6']['Sales'].sum()
p6_loss = (p6_b / months_before) * months_after - p6_a
p4p5_gain = after[after['Product_ID'].isin(['P4', 'P5'])]['Sales'].sum()
cann_rate = round((p6_loss / p4p5_gain * 100), 1) if p4p5_gain > 0 else 0

cust_before_set = set(before['Customer_ID'])
cust_after_set  = set(after['Customer_ID'])
cust_retained   = cust_before_set & cust_after_set
retention_rate  = round(len(cust_retained) / len(cust_before_set) * 100, 1)

cust_p6_before = set(before[before['Product_ID'] == 'P6']['Customer_ID'])
cust_new_after = set(after[after['Product_ID'].isin(['P4', 'P5'])]['Customer_ID'])
switchers = cust_p6_before & cust_new_after
switching_rate = round(len(switchers) / len(cust_p6_before) * 100, 1) if cust_p6_before else 0

data['kpis'] = {
    'total_sales':        int(df['Sales'].sum()),
    'total_revenue':      round(df['Revenue'].sum(), 0),
    'avg_price':          round(df['Price'].mean(), 2),
    'avg_rating':         round(df['Rating'].mean(), 2),
    'sales_growth':       round((after['Sales'].mean() - before['Sales'].mean()) / before['Sales'].mean() * 100, 2),
    'revenue_growth':     round((after['Revenue'].mean() - before['Revenue'].mean()) / before['Revenue'].mean() * 100, 2),
    'cann_rate':          cann_rate,
    'switching_rate':     switching_rate,
    'retention_rate':     retention_rate,
    'mkt_roi':            round(df['Revenue'].sum() / df['Marketing_Spend'].sum(), 2),
    'stock_avail':        round(df['Stock_Available'].mean() * 100, 1),
    'total_products':     int(df['Product_ID'].nunique()),
    'total_customers':    int(df['Customer_ID'].nunique()),
    'oos_records':        int((df['Stock_Available'] == 0).sum()),
}

# ═══════════════════════════════════════════════════════════════════════════════
# 2. Monthly Trends
# ═══════════════════════════════════════════════════════════════════════════════

monthly = df.groupby('Year_Month').agg(
    sales=('Sales', 'sum'),
    revenue=('Revenue', 'sum'),
    avg_price=('Price', 'mean'),
    records=('Sales', 'count'),
    spend=('Marketing_Spend', 'sum')
).reset_index()
monthly.columns = ['month', 'sales', 'revenue', 'avg_price', 'records', 'spend']
monthly['month_dt'] = pd.to_datetime(monthly['month'])
monthly.sort_values('month_dt', inplace=True)

data['monthly_trends'] = {
    'months':   monthly['month'].tolist(),
    'sales':    monthly['sales'].tolist(),
    'revenue':  [round(x, 0) for x in monthly['revenue'].tolist()],
    'spend':    [round(x, 0) for x in monthly['spend'].tolist()],
}

# ═══════════════════════════════════════════════════════════════════════════════
# 3. Product Performance
# ═══════════════════════════════════════════════════════════════════════════════

prod = df.groupby('Product_ID').agg(
    total_sales=('Sales', 'sum'),
    total_revenue=('Revenue', 'sum'),
    avg_sales=('Sales', 'mean'),
    avg_price=('Price', 'mean'),
    avg_rating=('Rating', 'mean'),
    category=('Category', 'first'),
    group=('Product_Group', 'first')
).round(2).reset_index()

prod_before_avg = before.groupby('Product_ID')['Sales'].mean().rename('avg_before')
prod_after_avg  = after.groupby('Product_ID')['Sales'].mean().rename('avg_after')
prod_before_sum = before.groupby('Product_ID')['Sales'].sum().rename('sales_before')
prod_after_sum  = after.groupby('Product_ID')['Sales'].sum().rename('sales_after')
prod_rev_before = before.groupby('Product_ID')['Revenue'].sum().round(0).rename('rev_before')
prod_rev_after  = after.groupby('Product_ID')['Revenue'].sum().round(0).rename('rev_after')
prod_stock      = (df.groupby('Product_ID')['Stock_Available'].mean() * 100).round(1).rename('stock_avail')
prod_mkt_spend  = df.groupby('Product_ID')['Marketing_Spend'].sum().round(2).rename('mkt_spend')
prod_oos_count  = df[df['Stock_Available'] == 0].groupby('Product_ID').size().rename('oos_count')

prod_growth = pd.concat([
    prod_before_avg, prod_after_avg,
    prod_before_sum, prod_after_sum,
    prod_rev_before, prod_rev_after,
    prod_stock, prod_mkt_spend, prod_oos_count
], axis=1).fillna(0)
prod_growth['avg_before'] = prod_growth['avg_before'].round(2)
prod_growth['avg_after'] = prod_growth['avg_after'].round(2)
prod_growth['sales_before'] = prod_growth['sales_before'].astype(int)
prod_growth['sales_after'] = prod_growth['sales_after'].astype(int)
prod_growth['oos_count'] = prod_growth['oos_count'].astype(int)
prod_growth['growth_pct'] = ((prod_growth['avg_after'] - prod_growth['avg_before']) / prod_growth['avg_before'].replace(0, np.nan) * 100).round(2).fillna(0)

prod = prod.merge(prod_growth.reset_index(), on='Product_ID', how='left')
prod['is_launched'] = prod['Product_ID'].isin(LAUNCHED_PRODUCTS)

def _assign_price_band(p):
    if p <= 50: return 'Budget (0-50)'
    if p <= 100: return 'Mid (51-100)'
    if p <= 200: return 'Premium (101-200)'
    return 'Luxury (201+)'

prod['price_band'] = prod['avg_price'].apply(_assign_price_band)
prod.sort_values('total_revenue', ascending=False, inplace=True)

data['products'] = prod.to_dict(orient='records')

# Monthly breakdown per product (aligned to data['monthly_trends']['months'])
all_months = data['monthly_trends']['months']
pm_agg = df.groupby(['Product_ID', 'Year_Month']).agg(
    sales=('Sales', 'sum'),
    revenue=('Revenue', 'sum')
).reset_index()
monthly_by_product = {}
for pid in prod['Product_ID']:
    sub = pm_agg[pm_agg['Product_ID'] == pid].set_index('Year_Month')
    monthly_by_product[pid] = {
        'sales': [int(sub.loc[m, 'sales']) if m in sub.index else 0 for m in all_months],
        'revenue': [round(float(sub.loc[m, 'revenue']), 0) if m in sub.index else 0 for m in all_months]
    }
data['monthly_by_product'] = monthly_by_product

# ═══════════════════════════════════════════════════════════════════════════════
# 4. Category Comparison
# ═══════════════════════════════════════════════════════════════════════════════

cat_period = df.groupby(['Category', 'Period_Flag']).agg(
    avg_sales=('Sales', 'mean'),
    total_revenue=('Revenue', 'sum'),
).reset_index()

categories = sorted(df['Category'].unique())
cat_data = []
for c in categories:
    cb = cat_period[(cat_period['Category']==c) & (cat_period['Period_Flag']=='Before_Launch')]
    ca = cat_period[(cat_period['Category']==c) & (cat_period['Period_Flag']=='After_Launch')]
    cat_data.append({
        'category': c,
        'sales_before': round(cb['avg_sales'].values[0], 2) if len(cb) else 0,
        'sales_after':  round(ca['avg_sales'].values[0], 2) if len(ca) else 0,
        'rev_before':   round(cb['total_revenue'].values[0], 0) if len(cb) else 0,
        'rev_after':    round(ca['total_revenue'].values[0], 0) if len(ca) else 0,
    })
data['categories'] = cat_data

# ═══════════════════════════════════════════════════════════════════════════════
# 5. Cannibalization Data
# ═══════════════════════════════════════════════════════════════════════════════

# P6 vs P4/P5 monthly
cann_prods = ['P4', 'P5', 'P6']
cann_monthly = df[df['Product_ID'].isin(cann_prods)].groupby(['Year_Month', 'Product_ID'])['Sales'].sum().reset_index()
cann_monthly['month_dt'] = pd.to_datetime(cann_monthly['Year_Month'])
cann_monthly.sort_values('month_dt', inplace=True)

cann_data = {}
for pid in cann_prods:
    pdata = cann_monthly[cann_monthly['Product_ID']==pid]
    cann_data[pid] = {
        'months': pdata['Year_Month'].tolist(),
        'sales': pdata['Sales'].tolist()
    }

data['cannibalization'] = {
    'rate': cann_rate,
    'p6_loss': int(p6_loss),
    'p4p5_gain': int(p4p5_gain),
    'switching_rate': switching_rate,
    'switchers': len(switchers),
    'p6_customers_before': len(cust_p6_before),
    'timeline': cann_data
}

# Customer migration
stayed_with_p6 = len(cust_p6_before & set(after[after['Product_ID']=='P6']['Customer_ID']))
lost = len(cust_p6_before) - len(switchers) - stayed_with_p6
data['cannibalization']['migration'] = {
    'switched': len(switchers),
    'stayed': stayed_with_p6,
    'lost': max(0, lost)
}

# ═══════════════════════════════════════════════════════════════════════════════
# 6. Regional Data
# ═══════════════════════════════════════════════════════════════════════════════

region_data = df.groupby('Region').agg(
    total_sales=('Sales', 'sum'),
    total_revenue=('Revenue', 'sum'),
    avg_sales=('Sales', 'mean'),
    customers=('Customer_ID', 'nunique'),
    avg_rating=('Rating', 'mean')
).round(2).reset_index()
data['regions'] = region_data.to_dict(orient='records')

# Region before/after
reg_period = df.groupby(['Region', 'Period_Flag'])['Sales'].mean().unstack().round(2).reset_index()
reg_period.columns = ['region', 'after', 'before']
reg_period_sum = df.groupby(['Region', 'Period_Flag'])['Sales'].sum().unstack().fillna(0).astype(int).reset_index()
reg_period_sum.columns = ['region', 'total_after', 'total_before']
reg_period = reg_period.merge(reg_period_sum, on='region', how='left')
data['region_period'] = reg_period.to_dict(orient='records')

# Region breakdown per product
reg_prod_agg = df.groupby(['Product_ID', 'Region']).agg(
    sales=('Sales', 'sum'),
    revenue=('Revenue', 'sum'),
    customers=('Customer_ID', 'nunique')
).reset_index()
reg_prod_before = before.groupby(['Product_ID', 'Region'])['Sales'].sum().rename('sales_before')
reg_prod_after = after.groupby(['Product_ID', 'Region'])['Sales'].sum().rename('sales_after')
reg_prod_agg = reg_prod_agg.merge(reg_prod_before, on=['Product_ID', 'Region'], how='left')
reg_prod_agg = reg_prod_agg.merge(reg_prod_after, on=['Product_ID', 'Region'], how='left').fillna(0)

region_by_product = {}
for pid in prod['Product_ID']:
    sub = reg_prod_agg[reg_prod_agg['Product_ID'] == pid].set_index('Region')
    region_by_product[pid] = {
        r: {
            'sales': int(sub.loc[r, 'sales']) if r in sub.index else 0,
            'revenue': round(float(sub.loc[r, 'revenue']), 0) if r in sub.index else 0,
            'customers': int(sub.loc[r, 'customers']) if r in sub.index else 0,
            'sales_before': int(sub.loc[r, 'sales_before']) if r in sub.index else 0,
            'sales_after': int(sub.loc[r, 'sales_after']) if r in sub.index else 0
        } for r in ['East', 'North', 'South', 'West']
    }
data['region_by_product'] = region_by_product

# ═══════════════════════════════════════════════════════════════════════════════
# 7. Marketing Data
# ═══════════════════════════════════════════════════════════════════════════════

mkt_by_product = df.groupby('Product_ID').apply(
    lambda x: round(x['Revenue'].sum() / x['Marketing_Spend'].sum(), 2) if x['Marketing_Spend'].sum() > 0 else 0
).reset_index()
mkt_by_product.columns = ['product', 'roi']
mkt_by_product['is_launched'] = mkt_by_product['product'].isin(LAUNCHED_PRODUCTS)
data['marketing'] = mkt_by_product.sort_values('roi', ascending=False).to_dict(orient='records')

# ═══════════════════════════════════════════════════════════════════════════════
# 8. Pricing Data
# ═══════════════════════════════════════════════════════════════════════════════

price_bands = df.groupby('Price_Band', observed=True).agg(
    avg_sales=('Sales', 'mean'),
    total_revenue=('Revenue', 'sum'),
    count=('Sales', 'count')
).round(2).reset_index()
price_bands.columns = ['band', 'avg_sales', 'total_revenue', 'count']
data['price_bands'] = price_bands.to_dict(orient='records')

# ═══════════════════════════════════════════════════════════════════════════════
# 9. Inventory Data
# ═══════════════════════════════════════════════════════════════════════════════

stock_monthly = df.groupby('Year_Month').agg(
    in_stock=('Stock_Available', 'sum'),
    total=('Stock_Available', 'count')
).reset_index()
stock_monthly['pct'] = (stock_monthly['in_stock'] / stock_monthly['total'] * 100).round(1)
stock_monthly['month_dt'] = pd.to_datetime(stock_monthly['Year_Month'])
stock_monthly.sort_values('month_dt', inplace=True)

data['inventory'] = {
    'months': stock_monthly['Year_Month'].tolist(),
    'stock_pct': stock_monthly['pct'].tolist()
}

oos_by_prod = df[df['Stock_Available']==0].groupby('Product_ID').size().sort_values(ascending=False).reset_index()
oos_by_prod.columns = ['product', 'oos_count']
data['inventory']['oos_by_product'] = oos_by_prod.to_dict(orient='records')

oos_by_cat = df.groupby('Category').agg(
    oos_count=('Stock_Available', lambda s: int((s == 0).sum())),
    total_records=('Stock_Available', 'count')
).reset_index()
oos_by_cat['oos_rate_pct'] = (oos_by_cat['oos_count'] / oos_by_cat['total_records'] * 100).round(2)
oos_by_cat.columns = ['category', 'oos_count', 'total_records', 'oos_rate_pct']
data['inventory']['oos_by_category'] = oos_by_cat.sort_values('oos_rate_pct', ascending=False).to_dict(orient='records')

# ═══════════════════════════════════════════════════════════════════════════════
# 10. Product Group Sales Trends
# ═══════════════════════════════════════════════════════════════════════════════

grp_monthly = df.groupby(['Year_Month', 'Product_Group'])['Sales'].sum().reset_index()
grp_monthly['month_dt'] = pd.to_datetime(grp_monthly['Year_Month'])
grp_monthly.sort_values('month_dt', inplace=True)

grp_trends = {}
for grp in sorted(df['Product_Group'].unique()):
    gdf = grp_monthly[grp_monthly['Product_Group']==grp]
    grp_trends[grp] = {
        'months': gdf['Year_Month'].tolist(),
        'sales': gdf['Sales'].tolist()
    }
data['group_trends'] = grp_trends

# ═══════════════════════════════════════════════════════════════════════════════
# 11. Recommendations
# ═══════════════════════════════════════════════════════════════════════════════

data['recommendations'] = [
    {'area': 'Product Strategy', 'priority': 'High', 'impact': 'High',
     'text': 'Monitor P6 closely. Consider differentiating or phasing it out if decline continues. P4/P5 are cannibalizing its market share.'},
    {'area': 'Pricing Strategy', 'priority': 'High', 'impact': 'Medium',
     'text': 'Reposition P6 pricing to compete with P4/P5. Consider promotional pricing for P6 to retain existing customers.'},
    {'area': 'Marketing Focus', 'priority': 'Medium', 'impact': 'High',
     'text': 'Redirect marketing spend to support P6 retention while promoting P4/P5 to new customer segments.'},
    {'area': 'Inventory Planning', 'priority': 'Medium', 'impact': 'Medium',
     'text': 'Maintain strong stock availability. Stockouts compound cannibalization by pushing customers to alternatives.'},
    {'area': 'Customer Retention', 'priority': 'High', 'impact': 'High',
     'text': 'Implement loyalty programs for P6 customers. Target switchers with win-back campaigns.'},
    {'area': 'Launch Strategy', 'priority': 'Medium', 'impact': 'High',
     'text': 'For future launches, assess cannibalization risk BEFORE launch. Target new customer segments.'},
    {'area': 'Growth Assessment', 'priority': 'High', 'impact': 'High',
     'text': 'Measure NET new revenue (growth minus cannibalized revenue) for accurate business assessment.'},
    {'area': 'Regional Strategy', 'priority': 'Low', 'impact': 'Low',
     'text': 'Regional performance is balanced. Continue uniform distribution strategy.'}
]

# ═══════════════════════════════════════════════════════════════════════════════
# SAVE
# ═══════════════════════════════════════════════════════════════════════════════


# 12. Advanced Chart Datasets (Histogram, Boxplot, Heatmaps, Waterfall)
hist_bins = [0, 10, 20, 30, 40, 50, 60, 75, 100, 150]
bin_labels = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-75', '76-100', '101+']
pre_hist, _ = np.histogram(before['Sales'].clip(upper=149), bins=hist_bins)
post_hist, _ = np.histogram(after['Sales'].clip(upper=149), bins=hist_bins)
pre_pct = [round(float(x / len(before) * 100), 2) for x in pre_hist]
post_pct = [round(float(x / len(after) * 100), 2) for x in post_hist]
data['sales_histogram'] = {
    'labels': bin_labels,
    'pre_pct': pre_pct,
    'post_pct': post_pct,
    'pre_counts': [int(x) for x in pre_hist],
    'post_counts': [int(x) for x in post_hist]
}

price_boxplot = []
for c in categories:
    s = df[df['Category'] == c]['Price']
    q1, med, q3 = np.percentile(s, [25, 50, 75])
    iqr = q3 - q1
    w_min = float(max(s.min(), q1 - 1.5 * iqr))
    w_max = float(min(s.max(), q3 + 1.5 * iqr))
    price_boxplot.append({
        'category': c,
        'min': round(w_min, 2),
        'q1': round(float(q1), 2),
        'median': round(float(med), 2),
        'q3': round(float(q3), 2),
        'max': round(w_max, 2),
        'mean': round(float(s.mean()), 2)
    })
data['price_boxplot'] = price_boxplot

reg_list = ['East', 'North', 'South', 'West']
cat_reg_rev = []
cat_reg_sales = []
for c in categories:
    row_r = []
    row_s = []
    for r in reg_list:
        sub = df[(df['Category'] == c) & (df['Region'] == r)]
        row_r.append(round(float(sub['Revenue'].sum()), 0))
        row_s.append(int(sub['Sales'].sum()))
    cat_reg_rev.append(row_r)
    cat_reg_sales.append(row_s)
data['category_region_matrix'] = {
    'categories': categories,
    'regions': reg_list,
    'revenue': cat_reg_rev,
    'sales': cat_reg_sales
}

all_m = data['monthly_trends']['months']
heatmap_rows = []
for p in data['products']:
    pid = p['Product_ID']
    pm_sales = data['monthly_by_product'][pid]['sales']
    pre_vals = [pm_sales[i] for i, m in enumerate(all_m) if m < '2024-06']
    pre_avg = (sum(pre_vals) / len(pre_vals)) if pre_vals and sum(pre_vals) > 0 else 0
    pct_row = []
    for val in pm_sales:
        if pre_avg > 0:
            pct_row.append(round((val - pre_avg) / pre_avg * 100, 1))
        else:
            pct_row.append(100.0 if val > 0 else 0.0)
    heatmap_rows.append({
        'product': pid,
        'category': p['category'],
        'is_launched': p['is_launched'],
        'pct_change': pct_row
    })
data['cannibalization']['product_month_heatmap'] = {
    'months': all_m,
    'rows': heatmap_rows
}

pre_rev_mo = float(before['Revenue'].sum()) / months_before
post_rev_mo = float(after['Revenue'].sum()) / months_after
p45_rev_mo = float(after[after['Product_ID'].isin(['P4', 'P5'])]['Revenue'].sum()) / months_after
p123_rev_mo = float(after[after['Product_ID'].isin(['P1', 'P2', 'P3'])]['Revenue'].sum()) / months_after
p6_pre_mo = float(before[before['Product_ID'] == 'P6']['Revenue'].sum()) / months_before
p6_post_mo = float(after[after['Product_ID'] == 'P6']['Revenue'].sum()) / months_after
p6_delta_mo = p6_post_mo - p6_pre_mo
other_delta_mo = (post_rev_mo - pre_rev_mo) - (p45_rev_mo + p123_rev_mo + p6_delta_mo)
data['revenue_waterfall'] = {
    'pre_avg_rev': round(pre_rev_mo, 0),
    'p4p5_gain': round(p45_rev_mo, 0),
    'p123_gain': round(p123_rev_mo, 0),
    'p6_loss': round(p6_delta_mo, 0),
    'other_shift': round(other_delta_mo, 0),
    'post_avg_rev': round(post_rev_mo, 0)
}

# Convert numpy types for JSON
def convert(obj):
    if isinstance(obj, (np.integer,)):       return int(obj)
    if isinstance(obj, (np.floating,)):      return float(obj)
    if isinstance(obj, (np.bool_,)):         return bool(obj)
    if isinstance(obj, np.ndarray):          return obj.tolist()
    if isinstance(obj, pd.Timestamp):        return str(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

js_content = "// Auto-generated dashboard data\nconst DASHBOARD_DATA = " + json.dumps(data, default=convert, indent=2) + ";\n"

output_path = os.path.join(DASH_DIR, 'data.js')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Dashboard data saved to: {output_path}")
print(f"Data sections: {list(data.keys())}")
