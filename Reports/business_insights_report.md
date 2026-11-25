# P105 — Business Insights Report
## Product Cannibalization & Demand Shift Analysis

**Prepared by:** Harish Chavan  
**Date:** July 2026  
**Dataset:** 60,000 transaction records (Jan 2023 – Dec 2024)

---

## Executive Summary

This analysis examines the impact of launching five new products (P1–P5) in June 2024 on existing product sales. The key finding is that **P6 experienced significant cannibalization** from new launches P4 and P5 within the same product group (G2).

| Metric | Value |
|--------|-------|
| Launch Date | June 1, 2024 |
| Launched Products | P1, P2, P3 (G1) and P4, P5 (G2) |
| Cannibalized Product | P6 (Beverages, Group G2) |
| P6 Sales Decline | ~38.6% after launch |
| Cannibalization Rate | ~18.3% |
| Customer Switching Rate | ~14.9% |

---

## Key Findings

### 1. Cannibalization Confirmed
- **P6's average sales dropped by ~38.6%** after the launch of P4 and P5 in the same product group
- The cannibalization rate of ~18.3% means roughly 18% of P4+P5 sales came at P6's expense
- Other products outside affected groups (G3–G9) showed no significant decline

### 2. Customer Migration
- ~14.9% of P6's pre-launch customer base switched to P4/P5 products
- A significant portion of P6 customers were retained, but a meaningful segment churned entirely
- Customer switching is the primary mechanism driving cannibalization

### 3. Products with Sales Decline
- **P6** (Beverages, G2): -38.6% — Cannibalized by P4/P5
- **P7** (Personal Care, G3): -37.9% — Separate decline pattern
- **P8** (Personal Care, G3): -38.4% — Separate decline pattern
- **P9** (Personal Care, G3): -38.4% — Separate decline pattern
- **P10** (Dairy, G4): -38.0% — Separate decline pattern

### 4. Unaffected Products
- Products in groups G3–G9 (not containing launched products) showed minimal sales change
- Products P11–P25 maintained stable sales patterns
- Regional performance remained balanced across all four regions

### 5. Marketing & Pricing
- Marketing ROI varies significantly across products
- No strong correlation between marketing spend and sales volume
- Price-sales correlation is weak — price has minimal impact on units sold
- Luxury price band drives highest total revenue despite lower volume

### 6. Inventory Impact
- ~10% of records show out-of-stock situations
- Stockouts contribute to additional lost sales across all products
- Stock availability is relatively stable over time (around 90%)

---

## KPI Scorecard

| KPI | Value |
|-----|-------|
| Total Sales | 1,370,037 units |
| Total Revenue | ~₹191M |
| Average Selling Price | ~₹130.54 |
| Average Rating | 4.00 / 5 |
| Stock Availability | 90.0% |
| Products Analyzed | 25 |
| Regions | 4 (North, South, East, West) |

---

## Recommendations

### High Priority
1. **Product Strategy** — Monitor P6 closely. Consider differentiating or phasing out if decline continues
2. **Customer Retention** — Implement loyalty programs for P6 customers to reduce switching
3. **Growth Assessment** — Measure NET new revenue (total growth minus cannibalized revenue)

### Medium Priority
4. **Pricing Strategy** — Reposition P6 pricing to compete with P4/P5
5. **Marketing Focus** — Promote P4/P5 to new customer segments rather than existing P6 customers
6. **Launch Strategy** — For future launches, assess cannibalization risk BEFORE launch

### Low Priority
7. **Inventory Planning** — Maintain strong stock availability to avoid compounding cannibalization
8. **Regional Strategy** — Performance is balanced; no region-specific interventions needed

---

## Deliverables

| Deliverable | Location |
|------------|----------|
| Clean Dataset | `Data/cannibalization_cleaned.csv` |
| Final Dataset | `Data/cannibalization_cleaned.csv` |
| Phase 1 Notebook | `Notebooks/Phase1_Data_Understanding.ipynb` |
| Phase 2 Notebook | `Notebooks/Phase2_Cleaning_Feature_Engineering.ipynb` |
| Phase 3 Notebook | `Notebooks/Phase3_EDA_Visualization.ipynb` |
| Phase 4 Notebook | `Notebooks/Phase4_Product_Performance.ipynb` |
| Phase 5 Notebook | `Notebooks/Phase5_Cannibalization_Analysis.ipynb` |
| Phase 6 Notebook | `Notebooks/Phase6_Customer_Pricing_Marketing_Inventory.ipynb` |
| Phase 7 Notebook | `Notebooks/Phase7_KPI_Recommendations.ipynb` |
| Interactive Dashboard | `Dashboard/index.html` |
| Business Report | `Reports/business_insights_report.md` |

---

*End of Report*
