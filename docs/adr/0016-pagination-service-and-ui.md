# ADR-0016: Pagination — Service Layer and UI

Added `page` and `pageSize` to `OrderQuery` in `orders.ts`. `getOrders()` now appends `.range((page - 1) * pageSize, page * pageSize - 1)` for offset-based pagination, and includes a `count: 'exact', head: true` call to get total rows. Return type extended with `total: number`. The `TransactionList` UI shows prev/next buttons and page-number buttons at the bottom of the list, with `currentPage` state that triggers re-fetch via `useEffect`.

**Considered Options**: Cursor-based pagination (more efficient for large datasets but requires composite keys and breaks sorting changes). Offset-based was chosen because transaction volume is modest (<10K rows), the UI needs page-number buttons for navigation, and the Supabase `.range()` API maps directly to offset/limit.
