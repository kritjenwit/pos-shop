# POS Shop Application

A Point of Sale (POS) system with a staff-facing dashboard and a customer self-ordering interface. Built with React 19, TypeScript, Vite, and Supabase.

## Features

- **Staff POS** — item management (CRUD with image uploads), basket checkout with PromptPay QR payment, transaction history, pending order approval workflow
- **Customer Self-Ordering** — public menu browsing, basket, order placement (appears as pending for staff approval), order status lookup via shareable link
- **Authentication** — custom bcrypt-based auth (no Supabase Auth); sessions persisted to localStorage with no expiry
- **Order Lifecycle** — pending → approved → paid (with optional receipt upload)
- **Responsive design** with Tailwind CSS

## Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Routing**: React Router 7 (lazy-loaded pages)
- **State Management**: React Context (AuthContext, AppContext)
- **Backend**: Supabase (PostgreSQL, Storage)
- **Auth**: Custom bcrypt (`signIn`/`signUp` via direct DB queries)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library (≥80% coverage)
- **Deployment**: Cloudflare Workers (via Wrangler)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` with your Supabase credentials
4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` — Start Vite development server
- `npm run build` — Type-check (`tsc -b`) then Vite production build
- `npm run lint` — Run ESLint (flat config)
- `npm run preview` — Build then Cloudflare Wrangler dev server
- `npm run deploy` — Build then deploy to Cloudflare via Wrangler
- `npm run test` — Run Vitest in watch mode
- `npm run test:run` — Run tests once
- `npm run test:coverage` — Run tests with coverage report (≥80% required)

## Project Structure

```
src/
├── app/                    # Entry point (main.tsx) and root App component
│   └── App.tsx             # AuthProvider > BrowserRouter > AppContent, routing
├── routes/                 # Staff POS pages (auth-gated, lazy-loaded)
│   ├── Checkout/           # Customer + admin checkout views
│   ├── ItemList/           # Main tabbed POS page (items, management, checkout)
│   ├── ItemManagement/     # CRUD for items
│   ├── Login/              # Sign in / Sign up
│   ├── PendingOrders/      # Pending order list + detail
│   ├── Profile/            # User profile
│   └── Transactions/       # Transaction list + detail
├── customer/               # Public self-ordering pages (no auth required)
│   ├── Checkout/
│   ├── Menu/
│   └── Transactions/
└── shared/                 # Shared code
    ├── components/         # Reusable UI (MenuQRCode, TransactionDetailView)
    ├── constants/          # App constants
    ├── context/            # AuthContext, AppContext
    ├── lib/                # Supabase client, auth, orders, cache, thaiQR, util
    └── test/               # Vitest setup
docs/
├── adr/                    # Architecture Decision Records
└── agents/                 # Agent instructions (domain glossary, issue tracker)
```

## Architecture

- **Auth wrap order** (do not change): `AuthProvider` > `BrowserRouter` > `AppContent`
- **Auth**: Custom bcrypt `signIn`/`signUp` querying `users` table directly; no Supabase Auth, no refresh tokens, no session expiry
- **Service layer**: Order/transaction DB operations centralized in `src/shared/lib/orders.ts` (pages no longer import `supabase` directly for queries)
- **Basket**: Persisted to localStorage; separate keys for staff (`pos-shop-staff-basket`) and customer (`pos-shop-customer-basket`)
- **Items**: Cached with TTL via `src/shared/lib/cache.ts`
- **Image storage**: Supabase private bucket, resolved via signed URLs at render time

## Authentication

The app uses custom bcrypt-based authentication against the `users` table:
- `signIn(email, password)` — looks up user by email, compares bcrypt hash
- `signUp(email, password)` — bcrypt hashes password, inserts new user
- Sessions stored in localStorage key `pos-shop-user` (no expiry by design)

## Route Access Rules

| Route | Auth Required | Notes |
|---|---|---|
| `/menu`, `/checkout`, `/public/transactions/:id` | ❌ No | Public customer routes |
| `/`, `/transactions`, `/pending-orders`, `/profile`, `/checkout/:orderId` | ✅ Yes | Staff-only routes |

## Database Schema

- **`items`** — menu items (name, price, image, category, active)
- **`users`** — staff accounts (email, password_hash, full_name, phone)
- **`transactions`** — orders with status (pending/approved/completed/cancelled), customer info
- **`transaction_items`** — line items per transaction
- **`profiles`** — user profile details

## Testing

Tests use Vitest + React Testing Library with mocked Supabase and auth calls. Every module has a co-located test file.

```bash
npm run test:run        # Single run
npm run test:coverage   # With coverage (≥80% required)
npm run test            # Watch mode
```

## Architecture Decision Records

Key architectural decisions are recorded in `docs/adr/`:
- **ADR-0001** — Service layer for order operations
- **ADR-0002** — Separate basket keys for customer and staff

## Important Notes

- TypeScript checks run as part of the build (`tsc -b`)
- Lazy-loading is enforced for all pages (via `React.lazy()` + `Suspense`)
- Environment variables loaded from `.env` (gitignored)
- Deployed to Cloudflare Workers via `wrangler.toml`
