# ADR-0022: Context Split and Module Deepening

**Date**: 2026-06-13
**Status**: Accepted

## Context

`AppContext` had grown to 19 properties across 4 domains — items, basket, orders, and UI state. Every consumer re-rendered on any state change, and test mocking required building the full surface even when testing a single concern. The `orders.ts` module mixed read and write operations behind a single interface, and a dead `_allItems` parameter had accumulated from a previous refactor.

## Decision

### AppContext split into three contexts

- **`ItemContext`** — items CRUD, loading, error, localStorage cache via `cache.ts`
- **`BasketContext`** — basket map, add/remove/clear/removeItemCompletely, localStorage persistence driven by `basketKey` prop
- **`OrderContext`** — `completeOrder`, `createPendingOrder`, `approveOrder`, `confirmPayment` (basket passed as parameter, not read from context)
- **`AppContext`** retained as a thin shell that nests all three and re-exports a backward-compatible `useApp()` hook — no consumer changes needed

`total` is derived via `useMemo` in the combined layer. `deleteItem` also calls `removeItemCompletely` to keep basket in sync.

### orders.ts split into queries + commands

- `orders.queries.ts` — `getOrders`, `getOrderDetail`
- `orders.commands.ts` — `createOrder`, `createPendingOrder`, `approveOrder`, `cancelOrder`, `confirmPayment`, `uploadReceipt`
- `orders.ts` — barrel re-export (no import changes required across the codebase)
- `buildTransactionItemsFromDb` extracted as public `validateBasketPrices` + `TransactionItemInput` type in `items.ts`
- Dead `_allItems: Item[]` parameter removed from both `createOrder` and `createPendingOrder` and all call sites

### Related additions

- `useFetchData.ts` — generic data-fetching hook with ref-based cancellation, used by AnalyticsPage and TransactionList
- `ROUTES.menu` constant added to `constants/index.ts`
- `fetchTransaction` optional prop added to `TransactionDetailView`

## Consequences

- 3 new context files, 1 new hook, 2 split modules, 1 constant addition
- No consumer code changes needed — `useApp()` remains backward-compatible
- Test count: +20 new tests (ItemContext + OrderContext + useFetchData improvements)
- Branch coverage: 84.04% → 85.38%
- Total 495 tests, build + lint 0 errors
