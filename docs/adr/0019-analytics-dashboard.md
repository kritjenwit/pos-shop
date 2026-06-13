# ADR-0019: Analytics Dashboard

**Date**: 2026-06-13
**Status**: Accepted

## Context

Staff needed visibility into sales performance. No reporting existed — only raw transaction lists.

## Decision

Added an analytics module and dashboard page:

- `src/shared/lib/analytics.ts` — three functions (`getSalesSummary`, `getDailySales`, `getTopItems`) querying completed transactions + transaction_items
- `src/routes/Analytics/AnalyticsPage.tsx` — lazy-loaded dashboard with summary cards (revenue/orders/avg), CSS bar chart for daily sales, top items table, 7/30/90d range selector
- StaffLayout nav includes Analytics link with `BarChart3` icon

## Consequences

- +1 service module, +1 route, +1 test file (14 tests)
- Total 451 test suite
- Bar chart uses pure CSS (no chart library dependency)
