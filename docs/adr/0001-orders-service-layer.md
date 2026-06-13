# ADR-0001: Service Layer for Order Operations

Introduced `src/shared/lib/orders.ts` as a dedicated module for all order/transaction database operations with a `{ data, error }` return pattern. Previously, every page imported `supabase` directly and built query chains inline, creating tight coupling to the Supabase query builder and forcing complex mock chains in every test. The service layer isolates schema dependencies to one file, simplifies page tests to a single `vi.mock('../../shared/lib/orders')` call, and provides a seam for future storage changes (e.g., swapping Supabase for a custom API).

**Considered Options**: Keeping operations on `AppContext` (would have bloated the context further), or writing per-page Supabase helpers (would have spread the coupling). Centralizing in a plain module (no class, no class-based DI) keeps it consistent with the existing `auth.ts` and `cache.ts` patterns.
