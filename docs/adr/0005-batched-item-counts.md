# ADR-0005: Batched Item Counts in getOrders

Replaced the per-transaction count loop in `getOrders()` (N queries for N transactions) with a single batched `select('transaction_id').in('transaction_id', txIds)` query and client-side counting. The trade-off is fetching slightly more data (all transaction_item IDs instead of just counts) for O(1) round trips instead of O(N). For a POS system where most transactions have few items, the data volume difference is negligible and the latency improvement from eliminating N sequential DB calls dominates.
