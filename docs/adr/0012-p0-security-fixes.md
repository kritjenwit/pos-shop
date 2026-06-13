# ADR-0012: P0 Security Fixes — Rate Limiting, Unified Errors, Password Removal

Three high-priority fixes from a comprehensive OWASP-based audit. (1) `getProfile()` in `profiles.ts` was selecting `password` (the bcrypt hash) — removed from the column list; `ProfilePage` does not need it. (2) `signIn()` in `auth.ts` added in-memory rate limiting with exponential backoff (5 attempts within 60s triggers `2^excess` second delays). (3) Both "User not found" and "Invalid password" now return `"Invalid email or password"` to prevent user enumeration via timing or error text.

**Key constraint**: The rate limit store is a `Map<string, { count, resetAt }>` in module scope — ephemeral, per-server, and reset on deploy. Acceptable for a POS system where sign-in volume is low and redeploy frequency is high. Not suitable for distributed deployments without a shared store (Redis, DB).
