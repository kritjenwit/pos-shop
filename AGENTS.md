# AGENTS.md

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Type-check then build (`tsc -b && vite build`)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Architecture
- Single-page React 19 + TypeScript + Vite app with React Router
- Pages: `src/pages/Login/LoginPage.tsx`, `src/pages/ItemList/ItemList.tsx`, `src/pages/ItemManagement/ItemManagement.tsx`, `src/pages/Checkout/Checkout.tsx`
- Pages: `src/pages/Transactions/TransactionList.tsx`, `src/pages/Transactions/TransactionDetail.tsx`
- Contexts: `src/context/AuthContext.tsx` (Supabase auth), `src/context/AppContext.tsx` (app state)
- Supabase client: `src/lib/supabase.ts`

## Dependencies
- Supabase for auth/database (`@supabase/supabase-js`)
- Tailwind CSS for styling (`tailwindcss`, `postcss`, `autoprefixer`)
- `lucide-react` for icons
- `qrcode.react` for QR codes
- `bcryptjs` for password hashing
- `react-router-dom` for routing
- `uuid` for client-side UUID generation

## Supabase
- Database migrations: Run SQL in Supabase Dashboard > SQL Editor
- Tables: `items` (id UUID PK), `users` (id UUID PK), `transactions` (id UUID PK), `transaction_items` (id UUID PK, FK to transactions)
- Items table uses UUID: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Order flow: AppContext `completeOrder()` inserts into `transactions` then `transaction_items`

## Notes
- No test framework configured
- TypeScript 6.x uses `tsc -b` for project references
- `.env` contains Supabase credentials (never commit)