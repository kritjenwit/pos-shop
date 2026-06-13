# ADR-0003: Profiles Service Module

Extracted user profile queries (`getProfile`, `searchSellers`) from inline Supabase calls in `ProfilePage.tsx` and `TransactionList.tsx` into `src/shared/lib/profiles.ts`. This follows the same service-layer pattern established in ADR-0001 for orders and ADR-0001-adjacent for items — keeping DB operations behind a `{ data, error }` seam so pages never import the `supabase` client directly and tests mock a single module instead of complex chain builders.
