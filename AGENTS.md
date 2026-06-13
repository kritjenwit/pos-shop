# Agent Instructions — POS Frontend (Vite + React + Supabase)

## Repository Identity

- **Project**: Staff POS system with customer self-ordering interface
- **Tech stack**: Vite (build), React 19, TypeScript, Vitest + React Testing Library, Supabase (postgres + auth table), Cloudflare Workers (deploy)
- **Audience**: Custom bcrypt-based auth (no Supabase Auth), private image bucket, localStorage state persistence
- **Primary constraint**: Auth order (`AuthProvider` > `BrowserRouter` > `AppContent`) and lazy-loaded pages must not be violated

---

## Working Method — Task Execution Loop

**Every task follows this loop:**

1. **Plan** → read `.agents/skills/karpathy-guidelines/SKILL.md`
   - Before writing code, read the guideline skill to establish a minimal, explicit plan
   - Identify which files/tests will change
   - State the change scope in a short comment or outline

2. **Implement**
   - Write code following architecture rules (lazy loading, folder structure, auth gates, error handling)
   - Write or update tests alongside features (not after)
   - Follow linting rules as you go (`npm run lint` must pass)

3. **Scrutinize** → read `.agents/skills/scrutinize/SKILL.md`
   - Run `npm run build` — zero TS errors required
   - Run `npm run lint` — zero new warnings
   - Run `npm run test:coverage` — ≥80% statement coverage must pass
   - Use the scrutinize skill to review against the plan and detect regressions
   - Manually verify auth gates on any route changes
   - Verify no `console.error` or unhandled promise rejections introduced

4. **Iterate**
   - If any check fails, fix and re-run the relevant command
   - Do not move forward until all checks pass

5. **Verify Completion**
   - Review the task completion checklist (below) — all items must be ✅
   - Confirm no intentional deviations were accidentally "fixed"

---

## Task Completion Checklist

A task is **not complete** until every item is checked:

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `npm run lint` passes with zero new warnings
- [ ] `npm run test:coverage` passes with ≥80% statement coverage
- [ ] No `console.error` or unhandled promise rejections introduced
- [ ] No unused imports, variables, or parameters (TypeScript config enforces this)
- [ ] All type-only `import`s use `import type` syntax
- [ ] Auth gate rules respected: routes checked against `Route access rules` table below
- [ ] Lazy-loaded pages added via `React.lazy()` + `Suspense` in `App.tsx`, never direct imports
- [ ] New tests placed alongside their components (e.g., `src/routes/Login/LoginPage.test.tsx`)
- [ ] Error handling uses component state (`setError(message)`) rendered in JSX, never `console.error` alone
- [ ] Supabase and auth calls fully mocked in all tests (no real network calls in vitest)

---

## Architecture

### Entry Point & Auth Wrap Order
- **Entry**: `src/app/main.tsx` → `src/app/App.tsx`
- **Auth wrap order** (do **not** change): `AuthProvider` > `BrowserRouter` > `AppContent`

### Folder Layout

| Path | Purpose |
|---|---|
| `src/app/` | Root `App` component and entry point |
| `src/routes/` | Staff POS pages (auth-gated, lazy-loaded) |
| `src/customer/` | Public self-ordering pages (no auth required) |
| `src/shared/` | Contexts, lib utilities, shared components, constants, test setup |
| `src/shared/lib/supabase.ts` | Supabase client + types: `Item`, `User`, `Transaction`, `TransactionItem` |
| `src/shared/lib/auth.ts` | `signIn()`, `signUp()`, `updateUserPhone()` — bcrypt + direct DB queries |
| `src/shared/lib/cache.ts` | localStorage cache with TTL |
| `src/shared/lib/thaiQR.ts` | PromptPay QR code generation |
| `src/shared/context/AuthContext.tsx` | Auth state, persisted in localStorage key `pos-shop-user` |
| `src/shared/context/AppContext.tsx` | Items, basket, order lifecycle — all persisted in localStorage |

### Route Access Rules

| Route | Auth required | Notes |
|---|---|---|
| `/menu`, `/checkout`, `/public/transactions/:id` | ❌ No | Public routes, customer access |
| `/`, `/transactions`, `/pending-orders`, `/profile`, `/checkout/:orderId` | ✅ Yes | Staff-only routes, behind auth gate |

---

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server — use this for all local development |
| `npm run build` | `tsc -b` then `vite build` — **must** produce zero TS errors |
| `npm run lint` | ESLint (flat config) — must pass before committing |
| `npm run preview` | Build + Cloudflare Worker emulation (not static preview) |
| `npm run deploy` | Build then deploy to Cloudflare via Wrangler |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Vitest single run with coverage report (≥80% required) |

---

## Implementation Rules

### Pages & Routes

✅ **DO:**
- Use `npm run dev` for all local development
- Add new pages as lazy-loaded components in `App.tsx`: `const NewPage = React.lazy(() => import('./routes/NewPage'))` + `<Suspense>`
- Place new page test files alongside their components: `src/routes/MyPage/MyPage.test.tsx`

❌ **DO NOT:**
- Import page components directly in `App.tsx` — all pages must be lazy-loaded
- Create new top-level `src/` folders without explicit instruction
- Create a separate vitest config file — vitest lives in `vite.config.ts`

### Auth & Sessions

✅ **DO:**
- Mock auth via `vi.mock('../../shared/lib/auth')` in tests
- Read/write sessions from localStorage key `pos-shop-user` (JSON-serialized `User` object)
- Query the `users` table directly via bcrypt in `src/shared/lib/auth.ts`

❌ **DO NOT:**
- Use Supabase Auth anywhere — use custom `signIn()`/`signUp()` instead
- Add session expiry logic — sessions have no expiry by design
- Add token refresh logic — there are no refresh tokens by design
- Rely on `.env` values to make real Supabase calls in tests

### Error Handling

✅ **DO:**
- Surface errors via component state: `const [error, setError] = useState('')` rendered in JSX
- Handle both the `error` field on Supabase responses **and** `catch` blocks on every async call
- Provide inline error messages users will see

❌ **DO NOT:**
- Use `console.error` as the sole error handler
- Throw unhandled errors from components
- Add a global toast/notification system (none exists)
- Add global error boundaries unless explicitly asked

### Image Storage

✅ **DO:**
- Call `getSignedImageUrl()` at render time — it is a passthrough for `data:` and `http:` URLs
- Treat `Item.image` as a file path only; resolve to a URL at render time
- Let URLs expire after 3600s (do not cache beyond component lifecycle)

❌ **DO NOT:**
- Store `Item.image` as a full URL — store only the file path
- Cache signed URLs beyond the component lifecycle
- Assume the private bucket is public

**Note**: Bucket `pos-shop` is private with RLS policies scoped to authenticated users (SELECT, INSERT, UPDATE, DELETE).

---

## Testing Rules (Vitest + React Testing Library)

**Setup**: `src/shared/test/setup.ts` extends jest-dom matchers. Config is in `vite.config.ts` (jsdom, globals: true).

### Mock Pattern — Mutable Mocks

✅ **DO use `vi.hoisted()` for mutable mocks** so return values can change between tests:

```ts
const mockSelect = vi.hoisted(() => vi.fn());
const mockSingle = vi.hoisted(() => vi.fn());

vi.mock('../../shared/lib/supabase', () => ({
  supabase: { from: vi.fn(() => ({ select: mockSelect })) },
  uploadImage: vi.fn(),
  getSignedImageUrl: vi.fn(),
}));
```

### Supabase Chain Mocking

✅ **DO mock every method in a chain** — `.from().select().eq().single()` requires each method to return the next mock:

```ts
mockSelect.mockImplementation(() => {
  const p = Promise.resolve({ data: mockData, error: null });
  (p as any).single = mockSingle; // .single() must exist as a property
  return p;
});
```

### AuthContext Mocking

✅ **DO spread `vi.importActual`** to preserve the `AuthProvider` export, or tests will break:

```ts
vi.mock('../../shared/context/AuthContext', async () => {
  const actual = await vi.importActual('../../shared/context/AuthContext');
  return { 
    ...actual, 
    useAuth: vi.fn(() => mockAuthValue) 
  };
});
```

❌ **DO NOT:**
- Use `vi.mocked(vi.fn())` to share mocks across tests — it creates a new mock each time
- Leave any Supabase or auth call unmocked in tests
- Rely on `.env` values for real network calls

---

## Environment Variables

**Required in `.env`:**
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_KEY` — Supabase anon key
- `VITE_ENVIRONMENT` — deployment environment
- `VITE_CACHE_DURATION_HOURS` — localStorage cache TTL

---

## Intentional Deviations — Do Not Change

These patterns are deliberate. Do not refactor, warn about, or attempt to "fix" them:

| Pattern | Why it exists |
|---|---|
| `window.location.href` on some pages instead of `useNavigate()` | Forces a full page reload — intentional |
| ESLint rules disabled: `react-hooks/exhaustive-deps`, `react-hooks/set-state-in-effect`, `react-refresh/only-export-components` | Intentionally suppressed for this codebase |
| Sessions have no expiry and no refresh tokens | Deliberate product decision |
| `verbatimModuleSyntax: true` in tsconfig | Enforces `import type` for type-only imports — do not remove |
| `noUnusedLocals` + `noUnusedParameters` in tsconfig | Remove genuinely dead code; **do not** remove params that satisfy a required function signature |

---

## Ask-First Boundaries

Before making these changes, ask the user or document them as a breaking change:

- Changing the auth wrap order in `App.tsx`
- Adding a global error boundary or toast notification system
- Using Supabase Auth instead of custom bcrypt auth
- Changing the localStorage session key or format
- Adding session expiry or refresh token logic
- Making the `pos-shop` bucket public
- Removing lazy-loading from any page in `App.tsx`

---

## Never Boundaries

Do **not** do these things without explicit prior user consent:

- Delete or rename existing routes (ask first about breaking public URLs)
- Remove or weaken auth gates on staff routes
- Store plaintext passwords or API keys in code
- Disable TypeScript checks or linting rules
- Hard-code Supabase credentials (always use `.env`)
- Add external dependencies without listing them in comments

---

## Final Response Format

When a task is complete, confirm:

1. **What changed** — list files/functions modified
2. **Why** — brief rationale
3. **Verification** — which commands ran and passed
4. **Blockers** — any follow-up needed or decisions deferred
