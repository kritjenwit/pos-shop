# ADR-0014: P2 Security Hardening — CSP, File Validation, Password Policy

Three medium-priority items from the security audit. (1) Added `public/_headers` file with Content-Security-Policy (restrictive: same-origin scripts/styles, HTTPS images/fonts, `'none'` for object/media/frame-connect), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin`. Served by Cloudflare Pages via `_headers` convention. (2) File upload validation in `images.ts` — rejects non-JPEG/PNG/WebP files and files >10MB before calling `supabase.storage.upload()`. (3) `validatePassword()` in `auth.ts` enforces minimum 8 characters, one uppercase, one number, one special character; applied in `signUp()` sign-up path.

**Key constraint**: CSP is restrictive and may block future integrations (e.g., analytics scripts, external image CDNs). The `_headers` file must be updated if new external resources are added.
