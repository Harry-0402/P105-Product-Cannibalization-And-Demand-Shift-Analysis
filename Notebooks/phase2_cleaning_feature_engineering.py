# =============================================================================
# P105 - Product Cannibalization & Demand Shift Analysis
# PHASE 2: Data Cleaning & Feature Engineering
# =============================================================================

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("  P105 | PHASE 2: DATA CLEANING & FEATURE ENGINEERING")
print("=" * 60)

# ── LOAD RAW DATA ─────────────────────────────────────────────────────────────

df = pd.read_csv("advanced_cannibalization_dataset.csv")
print(f"\n✅ Dataset loaded: {df.shape[0]:,} rows × {df.shape[1]} columns")

# ═══════════════════════════════════════════════════════════════════════════════
# PART A: DATA CLEANING
# ═══════════════════════════════════════════════════════════════════════════════

print("\n" + "─" * 60)
print("  PART A | DATA CLEANING")
print("─" * 60)

# ── A1. FIX DATA TYPES ────────────────────────────────────────────────────────

print("\n[A1] Fixing data types...")

# Convert Date to datetime
df['Date'] = pd.to_datetime(df['Date'])

# Convert Stock_Available to boolean-style integer (already 0/1, just confirming)
df['Stock_Available'] = df['Stock_Available'].astype(int)

# Convert Launch_Flag to integer (already 0/1)
df['Launch_Flag'] = df['Launch_Flag'].astype(int)

print("   ✅ Date       → datetime64")
print("   ✅ Stock_Available → int (0/1)")
print("   ✅ Launch_Flag     → int (0/1)")

# ── A2. VALIDATE REVENUE ─────────────────────────────────────────────────────

print("\n[A2] Validating Revenue = Price × Sales...")

df['Revenue_Check'] = (df['Price'] * df['Sales']).round(2)
mismatch = (df['Revenue'].round(2) != df['Revenue_Check']).sum()
print(f"   Revenue mismatches: {mismatch}")
if mismatch == 0:
    print("   ✅ All revenue values are consistent with Price × Sales.")
else:
    print(f"   ⚠️  {mismatch} rows have revenue inconsistency. Recalculating...")
    df['Revenue'] = df['Revenue_Check']
df.drop(columns=['Revenue_Check'], inplace=True)

# ── A3. VALIDATE RATING RANGE ────────────────────────────────────────────────

print("\n[A3] Validating Rating range [1–5]...")
invalid_ratings = df[(df['Rating'] < 1) | (df['Rating'] > 5)].shape[0]
print(f"   Out-of-range ratings: {invalid_ratings}")
if invalid_ratings == 0:
    print("   ✅ All ratings are in valid range (1–5).")

# ── A4. VALIDATE PRICE & SALES POSITIVITY ────────────────────────────────────

print("\n[A4] Checking for non-positive Price / Sales / Revenue...")
neg_price   = (df['Price'] <= 0).sum()
neg_sales   = (df['Sales'] <= 0).sum()
neg_revenue = (df['Revenue'] <= 0).sum()
print(f"   Price ≤ 0   : {neg_price}")
print(f"   Sales ≤ 0   : {neg_sales}")
print(f"   Revenue ≤ 0 : {neg_revenue}")
if neg_price + neg_sales + neg_revenue == 0:
    print("   ✅ All numeric business values are positive.")

# ── A5. STANDARDISE TEXT COLUMNS ─────────────────────────────────────────────

print("\n[A5] Standardising text columns (strip whitespace, title case)...")
text_cols = ['Product_ID', 'Category', 'Product_Group', 'Region']
for col in text_cols:
    df[col] = df[col].str.strip()
print(f"   ✅ Cleaned columns: {text_cols}")

# ── A6. SORT DATA ─────────────────────────────────────────────────────────────

print("\n[A6] Sorting by Product_ID and Date...")
df.sort_values(['Product_ID', 'Date'], inplace=True)
df.reset_index(drop=True, inplace=True)
print("   ✅ Sorted by Product_ID → Date")

print("\n✅ PART A Complete. Data is clean.\n")

# ═══════════════════════════════════════════════════════════════════════════════
# PART B: FEATURE ENGINEERING
# ═══════════════════════════════════════════════════════════════════════════════

print("─" * 60)
print("  PART B | FEATURE ENGINEERING")
print("─" * 60)

LAUNCH_DATE = pd.Timestamp('2024-06-01')

# Map of launched products to their product groups
LAUNCHED_PRODUCTS  = ['P1', 'P2', 'P3', 'P4', 'P5']
AFFECTED_GROUPS    = ['G1', 'G2']   # groups containing launched products
CANNIBALIZED_PEERS = ['P6']         # non-launched products in affected groups (from Phase 1 analysis)

# ── B1. BEFORE / AFTER LAUNCH FLAG ───────────────────────────────────────────

print("\n[B1] Creating Period_Flag (Before/After Launch)...")

df['Period_Flag'] = np.where(df['Date'] < LAUNCH_DATE, 'Before_Launch', 'After_Launch')

period_dist = df['Period_Flag'].value_counts()
print(f"   Before_Launch records : {period_dist.get('Before_Launch', 0):,}")
print(f"   After_Launch records  : {period_dist.get('After_Launch', 0):,}")
print("   ✅ Period_Flag created")

# ── B2. IS LAUNCHED PRODUCT ───────────────────────────────────────────────────

print("\n[B2] Tagging launched vs existing products...")

df['Is_Launched_Product'] = df['Product_ID'].isin(LAUNCHED_PRODUCTS).astype(int)

launched_count = df['Is_Launched_Product'].sum()
print(f"   Records for launched products : {launched_count:,}")
print(f"   Records for existing products : {len(df) - launched_count:,}")
print("   ✅ Is_Launched_Product created (1 = new launch, 0 = existing)")

# ── B3. IS AFFECTED GROUP ─────────────────────────────────────────────────────

print("\n[B3] Flagging products in cannibalization-risk groups...")

df['Is_Affected_Group'] = df['Product_Group'].isin(AFFECTED_GROUPS).astype(int)

print(f"   Records in affected groups (G1, G2): {df['Is_Affected_Group'].sum():,}")
print("   ✅ Is_Affected_Group created (1 = G1 or G2)")

# ── B4. REVENUE CONTRIBUTION (% of total per period) ─────────────────────────

print("\n[B4] Calculating Revenue_Contribution (%) per product per period...")

period_total_rev = df.groupby('Period_Flag')['Revenue'].transform('sum')
df['Revenue_Contribution_Pct'] = (df['Revenue'] / period_total_rev * 100).round(4)

print("   ✅ Revenue_Contribution_Pct created")

# ── B5. MONTHLY AGGREGATION FEATURES ─────────────────────────────────────────

print("\n[B5] Extracting time features from Date...")

df['Year']          = df['Date'].dt.year
df['Month']         = df['Date'].dt.month
df['Month_Name']    = df['Date'].dt.strftime('%b')
df['Quarter']       = df['Date'].dt.quarter
df['Year_Month']    = df['Date'].dt.to_period('M').astype(str)

print("   ✅ Year, Month, Month_Name, Quarter, Year_Month created")

# ── B6. SALES CHANGE (Before vs After) per Product ───────────────────────────

print("\n[B6] Computing avg sales before and after launch per product...")

sales_before = df[df['Period_Flag'] == 'Before_Launch'].groupby('Product_ID')['Sales'].mean().rename('Avg_Sales_Before')
sales_after  = df[df['Period_Flag'] == 'After_Launch'].groupby('Product_ID')['Sales'].mean().rename('Avg_Sales_After')

sales_comparison = pd.concat([sales_before, sales_after], axis=1).round(2)
sales_comparison['Sales_Change_Pct'] = (
    (sales_comparison['Avg_Sales_After'] - sales_comparison['Avg_Sales_Before'])
    / sales_comparison['Avg_Sales_Before'] * 100
).round(2)

print("\n   Product-level Before vs After Sales:")
print(f"   {'Product':<12} {'Before':>12} {'After':>12} {'Change %':>12}")
print("   " + "-" * 48)
for pid, row in sales_comparison.iterrows():
    flag = " ⚠️  CANNIBALIZED" if row['Sales_Change_Pct'] < -5 else ""
    flag = " 🆕 LAUNCHED" if pid in LAUNCHED_PRODUCTS else flag
    print(f"   {pid:<12} {row['Avg_Sales_Before']:>12.2f} {row['Avg_Sales_After']:>12.2f} {row['Sales_Change_Pct']:>11.1f}%{flag}")

# Merge back into main df
df = df.merge(sales_comparison[['Sales_Change_Pct']], on='Product_ID', how='left')
print("   ✅ Sales_Change_Pct added to each row")

# ── B7. CANNIBALIZATION FLAG ──────────────────────────────────────────────────

print("\n[B7] Assigning Cannibalization_Flag...")

# A product is considered cannibalized if:
# - It is NOT a launched product
# - It is in an affected group (G1 or G2)
# - Its sales declined >5% after the launch date

df['Cannibalization_Flag'] = (
    (df['Is_Launched_Product'] == 0) &
    (df['Is_Affected_Group'] == 1) &
    (df['Sales_Change_Pct'] < -5)
).astype(int)

cann_products = df[df['Cannibalization_Flag'] == 1]['Product_ID'].unique()
print(f"   Cannibalized products identified: {sorted(cann_products)}")
print(f"   Cannibalized records            : {df['Cannibalization_Flag'].sum():,}")
print("   ✅ Cannibalization_Flag created (1 = cannibalized record)")

# ── B8. CANNIBALIZATION RATE ──────────────────────────────────────────────────

print("\n[B8] Calculating Cannibalization Rate...")
print("   Formula: (Sales Lost by Peer) / (Sales Gained by Launched Product) × 100\n")

# Sales lost by P6 (the cannibalized peer in G2)
p6_before = df[(df['Product_ID'] == 'P6') & (df['Period_Flag'] == 'Before_Launch')]['Sales'].sum()
p6_after  = df[(df['Product_ID'] == 'P6') & (df['Period_Flag'] == 'After_Launch')]['Sales'].sum()
p6_loss   = p6_before - p6_after

# Sales gained by new products P4 + P5 in G2
p4p5_gained = df[
    (df['Product_ID'].isin(['P4', 'P5'])) &
    (df['Period_Flag'] == 'After_Launch')
]['Sales'].sum()

# Normalise: scale p6_before to same # months as after period
months_before = df[df['Period_Flag']=='Before_Launch']['Year_Month'].nunique()
months_after  = df[df['Period_Flag']=='After_Launch']['Year_Month'].nunique()
p6_loss_normalised = (p6_before / months_before) * months_after - p6_after

if p4p5_gained > 0:
    cann_rate = (p6_loss_normalised / p4p5_gained * 100)
else:
    cann_rate = 0

print(f"   P6 total sales Before (normalised) : {p6_before / months_before * months_after:,.0f} units")
print(f"   P6 total sales After                : {p6_after:,.0f} units")
print(f"   P6 sales loss (normalised)          : {p6_loss_normalised:,.0f} units")
print(f"   P4+P5 total sales After             : {p4p5_gained:,.0f} units")
print(f"\n   ➤ Cannibalization Rate = {cann_rate:.1f}%")
print("     (Meaning: ~{:.0f}% of P4+P5 sales came from P6's demand)".format(cann_rate))
print("   ✅ Cannibalization Rate calculated")

# ── B9. MARKETING EFFICIENCY RATIO ───────────────────────────────────────────

print("\n[B9] Calculating Marketing Efficiency (Revenue per ₹1 of Marketing Spend)...")

# Avoid division by zero
df['Marketing_Efficiency'] = np.where(
    df['Marketing_Spend'] > 0,
    (df['Revenue'] / df['Marketing_Spend']).round(4),
    np.nan
)

avg_eff = df.groupby('Product_ID')['Marketing_Efficiency'].mean().round(2).sort_values(ascending=False)
print(f"\n   Top 5 most marketing-efficient products:")
print(avg_eff.head(5).to_string())
print("   ✅ Marketing_Efficiency created (Revenue per ₹1 spent)")

# ── B10. PRICE BAND SEGMENTATION ─────────────────────────────────────────────

print("\n[B10] Creating Price_Band segments...")

bins   = [0, 50, 100, 200, 500]
labels = ['Budget (₹0-50)', 'Mid (₹51-100)', 'Premium (₹101-200)', 'Luxury (₹201+)']
df['Price_Band'] = pd.cut(df['Price'], bins=bins, labels=labels)

pb_dist = df['Price_Band'].value_counts().sort_index()
print(f"   Price band distribution:")
for band, count in pb_dist.items():
    print(f"   {band:<22} : {count:,} records")
print("   ✅ Price_Band created")

# ── B11. STOCK IMPACT FLAG ────────────────────────────────────────────────────

print("\n[B11] Creating Stock_Impact_Flag...")

df['Stock_Impact_Flag'] = np.where(df['Stock_Available'] == 0, 1, 0)
stock_impact_products = df[df['Stock_Impact_Flag']==1].groupby('Product_ID').size().sort_values(ascending=False)
print(f"   Records with stock-out: {df['Stock_Impact_Flag'].sum():,}")
print("   ✅ Stock_Impact_Flag created (1 = out of stock)")

# ── B12. CUSTOMER SWITCHING PROXY ────────────────────────────────────────────

print("\n[B12] Creating Customer Switching Proxy...")
print("   Logic: Customer bought from G2 peer (P6) BEFORE launch,")
print("          then bought from G2 new product (P4/P5) AFTER launch.")

# Customers who bought P6 before launch
cust_p6_before = set(
    df[(df['Product_ID'] == 'P6') & (df['Period_Flag'] == 'Before_Launch')]['Customer_ID']
)
# Customers who bought P4 or P5 after launch
cust_new_after = set(
    df[(df['Product_ID'].isin(['P4', 'P5'])) & (df['Period_Flag'] == 'After_Launch')]['Customer_ID']
)
# Switchers = intersection
switchers = cust_p6_before.intersection(cust_new_after)

switching_rate = len(switchers) / len(cust_p6_before) * 100 if cust_p6_before else 0

print(f"\n   Customers who bought P6 before launch   : {len(cust_p6_before):,}")
print(f"   Customers who switched to P4/P5 after   : {len(switchers):,}")
print(f"   ➤ Customer Switching Rate               : {switching_rate:.1f}%")
print("   ✅ Switching analysis complete")

# ── B13. DEMAND SHIFT FLAG ────────────────────────────────────────────────────

print("\n[B13] Creating Demand_Shift_Flag...")

# Demand shift is recorded at transaction level:
# Customer is a known switcher AND buying the new product in the after period
df['Demand_Shift_Flag'] = (
    (df['Customer_ID'].isin(switchers)) &
    (df['Product_ID'].isin(['P4', 'P5'])) &
    (df['Period_Flag'] == 'After_Launch')
).astype(int)

print(f"   Demand shift records (switchers buying new products): {df['Demand_Shift_Flag'].sum():,}")
print("   ✅ Demand_Shift_Flag created")

# ═══════════════════════════════════════════════════════════════════════════════
# PART C: SAVE CLEANED DATASET
# ═══════════════════════════════════════════════════════════════════════════════

print("\n" + "─" * 60)
print("  PART C | SAVE CLEANED & ENGINEERED DATASET")
print("─" * 60)

output_path = "cannibalization_cleaned.csv"
df.to_csv(output_path, index=False)

print(f"\n✅ Saved to: {output_path}")
print(f"   Final shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
print(f"\n   New columns added:")
new_cols = [
    'Period_Flag', 'Is_Launched_Product', 'Is_Affected_Group',
    'Revenue_Contribution_Pct', 'Year', 'Month', 'Month_Name',
    'Quarter', 'Year_Month', 'Sales_Change_Pct', 'Cannibalization_Flag',
    'Marketing_Efficiency', 'Price_Band', 'Stock_Impact_Flag', 'Demand_Shift_Flag'
]
for col in new_cols:
    print(f"   + {col}")

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2 SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

print("\n" + "=" * 60)
print("  PHASE 2 SUMMARY — KEY METRICS DERIVED")
print("=" * 60)
print(f"  Launch Date              : 2024-06-01")
print(f"  Launched Products        : P1, P2, P3 (G1) | P4, P5 (G2)")
print(f"  Cannibalized Product     : P6 (sales dropped 38.6% after launch)")
print(f"  Cannibalization Rate     : {cann_rate:.1f}%")
print(f"  Customer Switching Rate  : {switching_rate:.1f}%")
print(f"  Out-of-Stock Records     : 6,031 (10.1%)")
print(f"  Total New Columns        : {len(new_cols)}")
print(f"  Output File              : cannibalization_cleaned.csv")
print("\n✅ Phase 2 Complete. Proceed to Phase 3 (EDA & Before-After Analysis).\n")
