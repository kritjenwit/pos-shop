# ADR-0005: Batched Order Item Counts

`getOrders()` previously fired one `select(*, { count: 'exact', head: true }).eq('transaction_id', txId)` per transaction to count line items (N+1). Replaced with a single batched query — `select('transaction_id').in('transaction_id', txIds)` — and a client-side `Map` count. This eliminates the N+1 with minimal complexity: one Supabase query regardless of transaction count, at the cost of fetching full row data instead of just a count header.
