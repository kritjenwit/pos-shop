# ADR-0021: Single-Database, Multi-Schema Strategy for Dev/Test/Prod

**Decision**: Use two PostgreSQL schemas (`public` for production, `dev` for development/testing) within a single Supabase project, selected via Supabase's Extra Search Path setting.

## Context

Only one Supabase project is available (the Supabase free tier permits up to 2, but cost constraints limit us to 1). The project serves both real data (production) and development/test data. Using separate schemas within the same database avoids the operational complexity of managing a second Supabase project while keeping data isolated.

## Decision

- **`public` schema** — production data (used by the deployed Cloudflare Worker)
- **`dev` schema** — development and test data (used by local dev instances)
- **Selection mechanism**: Supabase Settings → API → Extra Search Path. Set to `"public, dev"` in dev environments; production stays at `"public"` only. The first schema in the search path is the default, so `CREATE TABLE` without a schema qualifier lands in `public` unless the path is reordered.
- **Runtime switching**: The app does not hardcode a schema name. Instead, the `VITE_ENVIRONMENT` env var controls which schema the local dev server points at via the search path configuration.

## Consequences

**Positive**:
- One Supabase project, one database, zero additional cost
- Same connection string for dev and prod — only the search path differs
- Schema copies are structurally identical (same tables, indexes, constraints)

**Negative**:
- Must maintain schema drift manually — any migration applied to `public` must also be applied to `dev`
- The `setup_dev_schema.sql` script must be kept in sync with migrations
- Risk of accidentally running dev queries against production data (mitigated by search path isolation)
- Supabase dashboard queries (Table Editor) default to `public` — switching to `dev` requires manual schema selection in the UI

## Implementation

A SQL file `supabase/setup_dev_schema.sql` creates the `dev` schema with copies of all 5 tables (`items`, `users`, `transactions`, `transaction_items`, `audit_log`), matching indexes, permissive RLS policies scoped to `authenticated` role. Run this once in Supabase SQL Editor, then configure the Extra Search Path.
