# Agent Instructions

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server — use this for all local development |
| `npm run build` | `tsc -b` then `vite build` — all TS errors must be fixed before this will succeed |
| `npm run lint` | ESLint (flat config) |
| `npm run preview` | Build then run locally via Wrangler — Cloudflare Worker emulation, **not** a static file preview |
| `npm run deploy` | Build then deploy to Cloudflare via Wrangler |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Vitest single run with coverage report |

---

## Task Completion Checklist

A task is **not complete** until every item below is checked:

- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero new warnings
- [ ] `npm run test:coverage` passes with ≥ 80% statement coverage
- [ ] No `console.error` / unhandled promise rejections introduced
- [ ] No unused imports, variables, or parameters (tsconfig enforces this)
- [ ] All new `import`s of types use `import type`

---

## Architecture

**Entry point**: `src/app/main.tsx` → `src/app/App.tsx`

**Auth wrap order** (must not be changed): `AuthProvider` > `BrowserRouter` > `AppContent`

**Route access rules**:
| Route | Auth required |
|---|---|
| `/menu`, `/checkout`, `/public/transactions/:id` | ❌ No |
| `/`, `/transactions`, `/pending-orders`, `/profile`, `/checkout/:orderId` | ✅ Yes |

**Rules**:
- ✅ DO use `npm run dev` for local development
- ✅ DO add new pages as lazy-loaded components in `App.tsx` via `React.lazy` + `Suspense`
- ❌ DO NOT import page components directly in `App.tsx` — all pages must be lazy-loaded
- ❌ DO NOT create a separate vitest config file — vitest config lives inside `vite.config.ts`
- ❌ DO NOT use Supabase Auth — auth is custom bcrypt against the `users` table

---

## Folder Layout

| Path | Purpose |
|---|---|
| `src/app/` | Root `App` component and entry point |
| `src/routes/` | Staff POS pages (auth-gated) |
| `src/customer/` | Public self-ordering pages |
| `src/shared/` | Contexts, lib, components, constants, test setup |
| `src/shared/lib/supabase.ts` | Supabase client + types: `Item`, `User`, `Transaction`, `TransactionItem` |
| `src/shared/lib/auth.ts` | `signIn`, `signUp`, `updateUserPhone` — bcrypt + direct DB queries |
| `src/shared/lib/cache.ts` | localStorage cache with TTL |
| `src/shared/lib/thaiQR.ts` | PromptPay QR generation |
| `src/shared/context/AuthContext.tsx` | Auth state — persisted in `localStorage` key `pos-shop-user` |
| `src/shared/context/AppContext.tsx` | Items, basket (persisted in localStorage), order lifecycle |

**Rules**:
- ✅ DO place new page test files alongside their component: `src/routes/Login/LoginPage.test.tsx`
- ✅ DO place new shared components in `src/shared/`
- ❌ DO NOT create new top-level `src/` folders without explicit instruction

---

## Error Handling

- ✅ DO surface errors via **inline component state**: `setError(message)` rendered in JSX
- ✅ DO handle both the `error` field on Supabase responses **and** `catch` blocks on every async call
- ❌ DO NOT use `console.error` as the sole error handler
- ❌ DO NOT throw unhandled errors from components
- ❌ DO NOT add a global toast/notification system — one does not exist; handle errors locally
- ❌ DO NOT add global error boundaries unless explicitly asked

---

## Auth & Security

- ✅ DO mock auth via `vi.mock('../../shared/lib/auth')` in tests
- ✅ DO read/write the session from `localStorage` key `pos-shop-user` (JSON-serialized `User` object)
- ❌ DO NOT use Supabase Auth anywhere — `signIn`/`signUp` query the `users` table directly via bcrypt
- ❌ DO NOT add session expiry logic — sessions have no expiry by design
- ❌ DO NOT add token refresh logic — there are no refresh tokens by design

**Required `.env` variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_ENVIRONMENT`, `VITE_CACHE_DURATION_HOURS`

---

## Image Storage

- ✅ DO call `getSignedImageUrl()` at render time — it is a passthrough for `data:` and `http` URLs
- ❌ DO NOT store `Item.image` as a URL — it stores file paths only; resolve to a URL at render time
- ❌ DO NOT cache signed URLs beyond the component lifecycle — they expire after 3600s

Supabase bucket `pos-shop` is private with RLS policies for SELECT / INSERT / UPDATE / DELETE scoped to authenticated users.

---

## Testing (Vitest + React Testing Library)

**Setup**: `src/shared/test/setup.ts` extends jest-dom matchers. Config is in `vite.config.ts` (jsdom environment, globals: true).

**Environment variables**: Vitest picks up `.env` automatically via Vite — but Supabase calls must still be fully mocked. Do not rely on `.env` values to make real network calls in tests.

### Mock rules

- ✅ DO declare mutable mocks with `vi.hoisted()` so return values can change between tests
- ✅ DO mock every method in a Supabase chain: `.from().select().eq().single()` — each must return the next mock
- ❌ DO NOT use `vi.mocked(vi.fn())` to share a mock across tests — it creates a new mock each call; use `vi.hoisted()` instead
- ❌ DO NOT leave any Supabase or auth call unmocked in tests

**Mutable mock pattern**:
```ts
const mockFn = vi.hoisted(() => vi.fn());

vi.mock('../../shared/lib/supabase', () => ({
  supabase: { from: mockFn },
  uploadImage: (...args: any[]) => mockUploadImage(...args),
  getSignedImageUrl: (...args: any[]) => mockGetSignedImageUrl(...args),
}));
```

**`.select().single()` trap** — `mockSelect` must return a thenable that also has a `.single` property. A bare Promise will break:
```ts
mockSelect.mockImplementation(() => {
  const p = Promise.resolve({ data: [], error: null });
  (p as any).single = mockSingle;
  return p;
});
```

**AuthContext mock** — always spread `vi.importActual` to preserve the `AuthProvider` export, or `<AuthProvider>` will throw:
```ts
vi.mock('../../shared/context/AuthContext', async () => {
  const actual = await vi.importActual('../../shared/context/AuthContext');
  return { ...actual, useAuth: vi.fn(() => ({ ... })) };
});
```

---

## Intentional Deviations — Do Not Change

These are deliberate. Do not refactor, warn about, or "fix" them.

| Pattern | Why it exists |
|---|---|
| `window.location.href` instead of `useNavigate()` on some pages | Forces a full page reload — intentional |
| ESLint rules disabled: `react-hooks/exhaustive-deps`, `react-hooks/set-state-in-effect`, `react-refresh/only-export-components` | Intentionally suppressed |
| Sessions have no expiry and no refresh tokens | Intentional product decision |
| `verbatimModuleSyntax: true` in tsconfig | Requires `import type` for type-only imports — enforce, don't remove |
| `noUnusedLocals` + `noUnusedParameters` in tsconfig | Remove genuinely dead code; do **not** remove params that satisfy a required function signature |
