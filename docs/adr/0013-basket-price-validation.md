# ADR-0013: Server-Side Basket Price Validation

Previously `createOrder` and `createPendingOrder` in `orders.ts` used `buildTransactionItems()`, which read item prices from the client-side `Item[]` array passed via `AppContext`. These prices come from a localStorage cache that a malicious user could tamper with. Added `buildTransactionItemsFromDb()` which fetches fresh prices from the `items` table inside the transaction insert, ensuring the line-item `unit_price` and `subtotal` always reflect the database record. The old client-side function was removed.

**Considered Options**: (1) Validate client prices against DB before insert — double query, no atomicity guarantee. (2) Overwrite with DB prices inside the insert flow — single additional `select` per order, prices locked at order time. Chose option 2 for atomicity and simplicity.
