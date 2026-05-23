# Agent Instructions

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | `tsc -b` then `vite build` — fix TS errors first |
| `npm run lint` | ESLint (flat config) |
| `npm run preview` | Build then wrangler dev |
| `npm run deploy` | Build then wrangler deploy |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Vitest run with coverage |

## Architecture

- **Entry**: `src/app/main.tsx` → `src/app/App.tsx`
- **Auth wrapping**: `AuthProvider` > `BrowserRouter` > `AppContent`
- **Public routes** (no auth): `/menu`, `/checkout`, `/public/transactions/:id`
- **Staff routes** (auth required): `/`, `/transactions`, `/pending-orders`, `/profile`, `/checkout/:orderId`
- **Lazy loading**: All page components are lazy-loaded via `React.lazy` + `Suspense`
- **Config**: Vite config lives in `vite.config.ts` — vitest config is **inside** it (environment, setup, globals). Do not create a separate vitest config.
- **Deploy**: Cloudflare Workers via `@cloudflare/vite-plugin` + wrangler
- **Database**: Supabase (PostgreSQL) — custom auth via bcrypt against `users` table, NOT Supabase Auth

## Folder layout

- `src/app/` — Root App component, entry point
- `src/routes/` — Staff POS pages (auth-gated)
- `src/customer/` — Public self-ordering pages
- `src/shared/` — Contexts (`AuthContext`, `AppContext`), lib, components, constants, test setup
- `src/shared/lib/supabase.ts` — Supabase client + types (`Item`, `User`, `Transaction`, `TransactionItem`)
- `src/shared/lib/auth.ts` — `signIn`, `signUp`, `updateUserPhone` (bcrypt + direct DB queries)
- `src/shared/lib/cache.ts` — localStorage-based cache with TTL
- `src/shared/lib/thaiQR.ts` — PromptPay QR generation
- `src/shared/context/AuthContext.tsx` — auth state, persisted via `localStorage` key `pos-shop-user`
- `src/shared/context/AppContext.tsx` — items, basket (persisted in localStorage), order lifecycle

## Testing (Vitest + React Testing Library)

**Setup**: `src/shared/test/setup.ts` extends jest-dom matchers. Config is in `vite.config.ts` (jsdom environment, globals: true).

**Mock patterns — all supabase + auth calls must be mocked:**

```ts
// Mutable mock state (needed when mock values change between tests)
const mockFn = vi.hoisted(() => vi.fn());

// Static mock
vi.mock('../../shared/lib/supabase', () => ({
  supabase: { from: mockFn },
  uploadImage: (...args: any[]) => mockUploadImage(...args),
  getSignedImageUrl: (...args: any[]) => mockGetSignedImageUrl(...args),
}));
```

- Mock **all** chained calls: `.from().select().eq().single()`, `.from().select().order()`, etc. Each method in the chain must return the next mock.
- `vi.mocked(vi.fn())` creates a **new mock** — use `vi.hoisted()` variables instead when you need to change mock return values between tests.
- `localStorage` works in jsdom — no polyfill needed.
- Test files live alongside their components (`src/routes/Login/LoginPage.test.tsx`).

## Auth & Security

- **Custom, not Supabase Auth**: `signIn`/`signUp` query the `users` table directly with bcrypt. Mock via `vi.mock('../../shared/lib/auth')`.
- **Session**: Stored in `localStorage` under key `pos-shop-user` (JSON serialized User object). No expiry, no refresh tokens.
- **`.env` vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_ENVIRONMENT`, `VITE_CACHE_DURATION_HOURS`

## Image storage

- Supabase bucket `pos-shop` is **private** with 4 RLS policies (SELECT/INSERT/UPDATE/DELETE for authenticated users)
- `Item.image` stores **file paths**, not URLs
- Resolve at render time via `getSignedImageUrl()` — passthrough for `data:`/`http` URLs. Signed URLs expire after 3600s.

## Styling

- **Tailwind CSS** + component-layer classes in `src/index.css`
- Base font size: **18px** (larger than default — affects spacing assumptions)
- Fonts: Rubik (headings, `font-heading`), Nunito Sans (body, default)
- Component classes: `.btn-primary`, `.btn-danger`, `.btn-secondary`, `.btn-ghost`, `.input-base`, `.card-base`, `.skeleton`, `.modal-backdrop`, `.modal-content`
- Colors: primary `#111111`, background `#F5F5F5`, card `#FFFFFF`, text `#111111`, textSecondary `#666666`, border `#E5E5E5`, danger `#EF4444`

## Coding quirks

- ESLint rules **OFF**: `react-hooks/exhaustive-deps`, `react-hooks/set-state-in-effect`, `react-refresh/only-export-components`
- Some pages use `window.location.href` instead of `useNavigate()` to force reload — ignore lint warnings for this
- `noUnusedLocals` and `noUnusedParameters` are ON in tsconfig — clean up unused code
- `verbatimModuleSyntax` is ON — use `import type` for type-only imports
