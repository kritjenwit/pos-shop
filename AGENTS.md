# AGENTS.md

## Commands
- `npm run dev` - Start Vite dev server
- `npm run build` - Type-check (tsc -b) and build with Vite
- `npm run lint` - Run ESLint (flat config)
- `npm run preview` - Build then run Wrangler dev
- `npm run deploy` - Build then deploy via Wrangler
- `npm run test:run` - Run Vitest tests once
- `npm run test:coverage` - Run tests with coverage

## Architecture
- React 19 + TypeScript + Vite, deployed to Cloudflare Workers
- React Router 7 with nested routes in `src/App.tsx`
- Pages: Login, ItemList (+ ItemManagement tab), Checkout, Profile, Transactions (list + detail)
- Contexts: `AuthContext` (auth state via localStorage), `AppContext` (app state + basket)
- Auth is **custom** (bcrypt + Supabase DB queries), NOT Supabase Auth
- All DB tables use UUID primary keys: `items`, `users`, `transactions`, `transaction_items`

## Key Patterns
- **Auth flow**: `src/lib/auth.ts` handles signIn/signUp. User stored in localStorage (key: `pos-shop-user`). No real session management.
- **Image storage**: Supabase bucket `pos-shop` is **private** with RLS. `Item.image` stores file paths (not URLs). Use `getSignedImageUrl()` to resolve at render time. Returns passthrough for data:/http URLs.
- **Navigation**: Some pages use `window.location.href` instead of `useNavigate()` — the eslint `react-hooks/immutability` rule rejects mutating `window.location`.
- **ESLint rules**: `exhaustive-deps` and `set-state-in-effect` are OFF.

## Design System
- Colors: black/white/gray palette (primary: #111111, background: #F5F5F5, accent: #333333, danger: #EF4444)
- Fonts: Rubik (headings) + Nunito Sans (body) via Google Fonts in `index.html`
- Component classes in `src/index.css`: `.btn-primary`, `.btn-danger`, `.btn-secondary`, `.btn-ghost`, `.input-base`, `.card-base`, `.modal-backdrop`, `.modal-content`, `.skeleton`
- Animations: `animate-fade-in`, `animate-scale-in`, `animate-slide-in` (Tailwind config)

## Testing
- Vitest + Testing Library — tests fail with `localStorage is not defined` / `document is not defined`
- Missing jsdom environment config in `vite.config.ts` or `vitest.config.ts` — add `{ test: { environment: 'jsdom' } }` to fix
- Mocks needed for `supabase` and `auth` modules (see existing test files)

## Supabase
- Bucket `pos-shop` must be private with 4 RLS policies (SELECT, INSERT, UPDATE, DELETE for authenticated users)
- SQL migration for phone column: `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;`
- `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` (never commit)

## Important Notes
- `npm run build` runs tsc type-checking first — fix TS errors before lint passes
- `ItemForm` in ItemManagement uses FileReader data URLs for new upload previews, signed URLs for existing images
- Signed URLs expire after 3600s (1 hour)
