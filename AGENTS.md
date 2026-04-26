# AGENTS.md

## Commands
- `npm run dev` - Start dev server (Vite dev)
- `npm run build` - Rebuild deps, type-check, then build
- `npm run lint` - Run ESLint
- `npm run preview` - Build then run Cloudflare Wrangler dev
- `npm run deploy` - Build then deploy to Cloudflare Workers/Pages
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage

## Architecture
- Single-page React 19 + TypeScript ~6.0 + Vite 8 app with React Router 7
- Pages: `src/pages/Login/`, `src/pages/ItemList/`, `src/pages/ItemManagement/`, `src/pages/Checkout/`
- Pages: `src/pages/Transactions/` (list + detail)
- Contexts: `src/context/AuthContext.tsx` (Supabase auth), `src/context/AppContext.tsx` (app state)
- Supabase client: `src/lib/supabase.ts`

## Dependencies
- Supabase (`@supabase/supabase-js`), Tailwind CSS, `lucide-react`, `qrcode.react`, `bcryptjs`, `uuid`
- Testing: Vitest, `@testing-library/react`, `@testing-library/jest-dom`

## Supabase
- Tables: `items`, `users`, `transactions`, `transaction_items` (all use UUID PK)
- Order flow: `AppContext.completeOrder()` inserts into `transactions` then `transaction_items`

## Notes
- `.env` contains Supabase credentials (never commit)