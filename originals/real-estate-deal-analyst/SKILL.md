---
name: real-estate-deal-analyst
title: Real Estate Deal Analyst
description: Analyze residential and small commercial real-estate deals like an investor — rental cash flow, cap rate, cash-on-cash return, DSCR, mortgage amortization, rent-vs-buy, BRRRR and flip math, sensitivity tables, comps checklist and due-diligence risks — producing a clear go / negotiate / pass memo. Use when someone asks whether a property is a good deal, to compare properties, estimate rental income, or decide to rent vs buy.
license: MIT
category: finance-accounting
---

# Real Estate Deal Analyst

Turn a listing into a decision. Always show assumptions, formulas and a sensitivity table so the
user can challenge the numbers. This is analysis, not financial advice — say so once.

## 1. Inputs (default what's missing and label defaults)

Price · closing costs (2–5%) · down payment % · interest rate & term · property tax · insurance · HOA · rent (market comps) · other income · vacancy (5–8%) · repairs/maintenance (5–10% of rent) · capex reserve (5–10%) · property management (8–10%) · utilities paid by owner · rehab budget · appreciation & rent growth (conservative: 2–3%).

## 2. Core metrics

```
Gross Scheduled Rent (GSR) = monthly rent × 12
Effective Gross Income (EGI) = GSR × (1 − vacancy) + other income
Operating Expenses (OpEx) = taxes + insurance + HOA + mgmt + repairs + capex + owner utilities
NOI = EGI − OpEx                         (excludes mortgage)
Cap rate = NOI ÷ price
Debt service = 12 × monthly P&I          P&I = L·r / (1 − (1+r)^−n)
Cash flow = NOI − debt service
Cash-on-cash = annual cash flow ÷ total cash invested (down + closing + rehab)
DSCR = NOI ÷ debt service                (lenders usually want ≥ 1.20–1.25)
Break-even occupancy = (OpEx + debt service) ÷ GSR
1% rule (screen only) = monthly rent ÷ price
```

For flips: ARV − (purchase + rehab + holding + selling costs 8–10%) = profit; apply the 70% rule as a screen: max offer ≈ 0.70 × ARV − rehab.
For rent vs buy: compare total 5–10 year cost including opportunity cost of the down payment, maintenance, transaction costs and equity build-up.

## 3. Sensitivity (always include)

A table of cash-on-cash (or cash flow) across rent −10% / base / +10% × interest rate −1% / base / +1%, plus vacancy 10% stress case. Highlight the scenario where the deal breaks.

## 4. Due-diligence checklist

Comps (3–5 sold within 0.5 mi / 6 months) · rent comps · zoning & permits · inspection (roof, foundation, HVAC, plumbing, electrical, sewer scope) · flood/fire zone & insurance quotes · HOA financials & rules on rentals · property tax reassessment after purchase · local landlord laws / rent control · title issues.

## 5. Output memo

1. Verdict: **Buy / Negotiate to $X / Pass** + one-sentence reason.
2. Key metrics table (NOI, cap rate, cash flow/mo, CoC, DSCR, break-even occupancy).
3. Assumptions table (flag defaults).
4. Sensitivity table.
5. Top 5 risks and how to verify each.
6. Max offer price that meets the user's target return (solve backwards).
