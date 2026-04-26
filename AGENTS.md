# AGENTS.md

## Commands
- `npm run dev` - Start Vite dev server
- `npm run build` - **Non-standard**: removes node_modules, reinstalls, type-checks, then builds
- `npm run lint` - Run ESLint
- `npm run preview` - Build then run Cloudflare Wrangler dev
- `npm run deploy` - Build then deploy to Cloudflare Workers/Pages
- `npm run test` - Run Vitest in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage

## Architecture
- Single-page React 19 + TypeScript + Vite app with React Router 7
- Pages: Login, ItemList, ItemManagement, Checkout, Transactions (list + detail)
- Contexts: AuthContext (Supabase auth), AppContext (app state)
- Supabase client: src/lib/supabase.ts
- All tables use UUID primary keys: items, users, transactions, transaction_items

## Dependencies
- Supabase (@supabase/supabase-js)
- Tailwind CSS, lucide-react, qrcode.react, bcryptjs, uuid
- Testing: Vitest, @testing-library/react, @testing-library/jest-dom

## Supabase
- Order flow: AppContext.completeOrder() inserts into transactions then transaction_items
- Image storage: Uses Supabase bucket with uploadImage/deleteImage functions in src/lib/supabase.ts
- .env contains Supabase credentials (never commit)

## Important Notes
- Build process explicitly cleans and reinstalls node_modules before building
- Type checking is part of the build process (tsc -b)
- Uses Cloudflare Wrangler for preview/deploy
- Environment variables loaded from .env (gitignored)