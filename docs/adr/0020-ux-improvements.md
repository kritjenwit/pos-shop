# ADR-0020: UX Improvement Sweep (P0/P1/P2)

**Date**: 2026-06-13
**Status**: Accepted

## Context

A full 18-page UX audit identified 43 issues (1 P0, 17 P1, 25 P2). Users had no error states, no field-level validation, silent redirects on API failures, and missing UX polish.

## Decision

All 43 issues addressed in priority order:

### P0 — Cancel confirmation dialog
- PendingOrderDetail shows `role="alertdialog"` with warning icon and explicit confirm before cancelling orders

### P1 — 17 fixes across 5 groups
- **Error states**: `itemsError` added to AppContext. MenuPage and ItemList show error banner + retry instead of misleading empty state
- **Validation**: Silent returns replaced with `setError` calls. Field-level messages instead of generic "One or more fields exceed maximum length"
- **Silent redirects**: 5 API error paths now show error banners with retry/back buttons instead of immediate `navigate()`
- **Cache**: TransactionList cache key includes page/filters. Date/seller filters passed server-side
- **Misc**: LoginPage production sign-up guard. PendingOrdersPage error/empty state mutual exclusion

### P2 — 25 fixes: character counters, phone format validation, date presets, 300ms search debounce, auto-polling, auto-dismiss success messages, copy-to-clipboard, skip-to-content on public routes, enhanced delete warnings, aria-labels on charts, QR privacy toggle

## Consequences

- 43 UX issues resolved across 25+ files
- Test suite grew from 417 to 451 (+34 tests)
- Build 0 errors, coverage maintained
