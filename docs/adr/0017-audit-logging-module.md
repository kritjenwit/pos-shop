# ADR-0017: Audit Logging Module

Created `src/shared/lib/audit.ts` with a single `logEvent(event, userId, metadata?)` function that writes to a new `audit_log` table (columns: `id`, `event`, `user_id`, `metadata`, `created_at`). Integrated into `auth.ts` — `signIn` logs `'sign_in'` on success, `signUp` logs `'sign_up'`. Uses a best-effort pattern: log failures are silently caught and do not block the caller.

**Considered Options**: (1) Using `console.log` — ephemeral, no persistence across server restarts. (2) Writing to a separate `audit_log` table — simple, survives restarts, auditable via SQL. Chose option 2 for persistence. The table is not RLS-scoped; audit logs are accessible to any authenticated user by design (operations need to see who did what).
