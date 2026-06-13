# POS Shop Application

A Point of Sale (POS) system with a staff-facing dashboard and a customer self-ordering interface. Built with **React 19 + TypeScript + Vite + Supabase**, deployed to **Cloudflare Workers**.

## Features

- **Staff POS** — item CRUD (with image uploads), basket checkout with PromptPay QR payment, transaction history, pending order approval workflow, profile management
- **Customer Self-Ordering** — public menu browsing with search, basket, order placement (appears as pending for staff approval), order status lookup via shareable link
- **Authentication** — custom bcrypt-based auth (no Supabase Auth), rate-limited sign-in, unified error messages to prevent user enumeration
- **Order Lifecycle** — pending → approved → paid (with optional receipt upload)
- **Dark Mode** — CSS custom properties, persistent via localStorage, respects `prefers-color-scheme`
- **Responsive** — mobile-first with Tailwind CSS breakpoints, touch-friendly baskets
- **Accessible** — skip-to-content link, `role="alert"` on errors, `role="dialog"` on modals, focus management, keyboard navigation

## Technology Stack

| Category | Choice |
|---|---|
| **Framework** | React 19 + TypeScript 6.0 + Vite 8 |
| **Routing** | React Router 7 (lazy-loaded pages via `React.lazy` + `Suspense`) |
| **State** | React Context (`AuthContext`, `AppContext`, `ThemeContext`) |
| **Backend** | Supabase (PostgreSQL, Storage) |
| **Auth** | Custom bcrypt via `bcryptjs` — direct DB queries, no Supabase Auth |
| **Styling** | Tailwind CSS 3 + CSS custom properties (dark mode) |
| **Icons** | Lucide React |
| **QR** | `qrcode.react` for PromptPay QR codes |
| **Unit Tests** | Vitest + React Testing Library (≥80% coverage) |
| **E2E Tests** | Playwright (smoke tests on login, menu, checkout) |
| **CI/CD** | GitHub Actions (build + lint + test:coverage on push/PR) |
| **Deployment** | Cloudflare Workers via Wrangler |

## Getting Started

### Prerequisites

- Node.js v18+
- Supabase project with the schema from `supabase/`

### Installation

```bash
git clone <repo>
cd pos-shop
npm install
npx playwright install chromium  # for E2E tests
```

Create a `.env` file:

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key
```

Start developing:

```bash
npm run dev
```

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | `tsc -b` then `vite build` (zero TS errors required) |
| `npm run lint` | ESLint (flat config) |
| `npm run preview` | Build + Cloudflare Wrangler dev |
| `npm run deploy` | Build then deploy to Cloudflare |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Vitest with coverage (≥80% required) |
| `npm run test:e2e` | Playwright E2E tests (dev server must be running) |

## Project Structure

```
src/
├── app/                       # Entry + root App
│   ├── App.tsx                # ThemeProvider > AuthProvider > BrowserRouter > ErrorBoundary > AppContent
│   ├── AppContent.tsx         # Routing logic (public routes vs staff layout vs login)
│   ├── StaffLayout.tsx        # Staff shell: header, nav, user menu, dark mode toggle
│   ├── PublicRoutes.tsx       # Customer-facing routes (no auth required)
│   └── LoadingScreen.tsx      # Initial loading state
├── routes/                    # Staff POS pages (auth-gated, all lazy-loaded)
│   ├── Checkout/              # CheckoutPage (wrapper), AdminCheckoutView, CustomerCheckoutView
│   ├── ItemList/              # Tabbed POS page: items grid, management, checkout
│   ├── ItemManagement/        # Item CRUD (modals, image upload, delete confirm)
│   ├── Login/                 # Sign in / Sign up (production-disabled sign-up)
│   ├── PendingOrders/         # Pending order list + approve/cancel detail
│   ├── Profile/               # User profile (name, email, phone)
│   └── Transactions/          # Transaction list (filterable) + detail view
├── customer/                  # Public pages (no auth required)
│   ├── Checkout/              # Customer checkout with basket → place pending order
│   ├── Menu/                  # Public menu with search + basket bar
│   └── Transactions/          # Order status lookup via shareable link
└── shared/
    ├── components/            # ErrorBoundary, MenuQRCode, TransactionDetailView
    ├── constants/             # App constants (COLORS, PAYMENT, VALIDATION, UI)
    ├── context/               # AuthContext, AppContext, ThemeContext
    ├── lib/                   # All service + utility modules
    │   ├── auth.ts            # signIn, signUp, updateUserPhone (bcrypt)
    │   ├── cache.ts           # localStorage cache with TTL
    │   ├── images.ts          # uploadImage, deleteImage, getSignedImageUrl
    │   ├── items.ts           # item CRUD (getItems, addItem, updateItem, deleteItem)
    │   ├── orders.ts          # order operations (getOrders, createOrder, approveOrder, ...)
    │   ├── profiles.ts        # getProfile, searchSellers
    │   ├── supabase.ts        # Supabase client + TypeScript interfaces
    │   ├── thaiQR.ts          # PromptPay QR generation (EMVCo spec)
    │   └── util.ts            # getEnv, generateOrderId, resetFormState
    └── test/                  # Vitest setup (jest-dom matchers)
docs/
├── adr/                       # 11 Architecture Decision Records
└── agents/                    # Agent instructions
e2e/                           # Playwright E2E test specs
public/
├── _headers                   # CSP + security headers (Cloudflare Workers)
└── _redirects                 # SPA fallback routing
```

## Service Layer Architecture

Pages no longer import `supabase` directly for queries. All database operations go through service modules in `src/shared/lib/`:

| Module | Responsibilities |
|---|---|
| `auth.ts` | Sign in/up with bcrypt (rate-limited, unified error messages), phone update |
| `orders.ts` | Transaction CRUD — batched item counts, paginated order list with filters |
| `items.ts` | Item CRUD + cleanup of storage images on delete |
| `profiles.ts` | User profile fetch (no password hash returned), seller search |
| `images.ts` | Supabase storage upload/delete/signed URL (file type + size validation) |
| `analytics.ts` | Sales summary, daily sales, top items |
| `audit.ts` | Audit logging (sign-in, sign-up events) |

All service functions return `{ data, error }` — never throw. Components handle errors via state + `console.error`.

## Authentication

- **Custom bcrypt** — passwords hashed with 10 salt rounds via `bcryptjs`
- **Rate limiting** — in-memory exponential backoff after 5 failed attempts per email (resets after 60s)
- **Unified errors** — both "user not found" and "wrong password" return `"Invalid email or password"` (prevents enumeration)
- **Password policy** — minimum 8 characters, at least 1 uppercase, 1 number, 1 special character
- **Session** — persisted in `localStorage` key `pos-shop-user` (password stripped before storage), no expiry by design
- **Sign-up** — disabled in production (`VITE_ENVIRONMENT !== 'production'`)

## Route Access Rules

| Route | Auth Required | Notes |
|---|---|---|
| `/menu`, `/checkout` | ❌ No | Public customer routes |
| `/public/transactions/:id` | ❌ No | Order status lookup (shareable link) |
| `/`, `/transactions` | ✅ Yes | Staff POS, transaction list |
| `/pending-orders`, `/pending-orders/:id` | ✅ Yes | Order approval workflow |
| `/profile` | ✅ Yes | User profile |
| `/checkout/:orderId` | ✅ Yes | Admin payment confirmation |
| `/analytics` | ✅ Yes | Sales dashboard with charts |

## Security

| Measure | Implementation |
|---|---|
| **Password hashing** | bcrypt (10 rounds) |
| **Rate limiting** | In-memory backoff on sign-in (5 attempts → exponential delay) |
| **Unified auth errors** | "Invalid email or password" for all failure modes |
| **Column selection** | Never `select('*')` — explicit column lists in all queries |
| **No password in localStorage** | Stripped before persisting `User` object |
| **Input validation** | Length limits on all user-facing fields (name, phone, item name, detail) |
| **SQL injection** | Wildcard characters escaped in `.or()` ILIKE queries |
| **File upload** | Only JPEG/PNG/WebP accepted, max 10MB |
| **CSP headers** | Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy (via `public/_headers`) |
| **Basket price validation** | Server-side price fetch at order time (not trusting cached client prices) |

## Database Schema

```sql
items         — id, name, price, image, quantity
users         — id, email, password, full_name, phone, created_at
transactions  — id, total_amount, status, created_by, created_at, receipt_url,
                customer_name, customer_phone, order_id, additional_detail
transaction_items — id, transaction_id, item_id, item_name, quantity, unit_price, subtotal
```

## Testing

- **Unit tests**: Vitest + React Testing Library with mocked Supabase (no real network calls)
- **Coverage**: ≥80% statement, branch, function, and line coverage enforced
- **E2E**: Playwright smoke tests (login, menu, checkout flow)
- **Pattern**: All Supabase/auth calls fully mocked via `vi.mock()`; mutable mocks use `vi.hoisted()`

```bash
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage report
npm run test:e2e       # E2E (dev server required)
```

## Architecture Decision Records

All key decisions are documented in `docs/adr/`:

| ADR | Decision |
|---|---|
| ADR | Decision |
|---|---|---|
| 0018 | Receipt upload after order |
| 0017 | Audit logging module |
| 0016 | Pagination for order list |
| 0015 | Analytics dashboard |
| 0014 | Basket price validation |
| 0013 | Password policy enforcement |
| 0012 | CSP headers + security headers |
| 0011 | Items service module |
| 0010 | AppContent routing split |
| 0009 | Dark mode via CSS variables |
| 0008 | TransactionDetail merge |
| 0007 | Checkout monolith split |
| 0006 | Reset form state dedup |
| 0005 | Batched order counts (N+1 fix) |
| 0004 | Images service module |
| 0003 | Profiles service module |
| 0002 | Separate basket keys for customer vs staff |
| 0001 | Orders service layer |

## Design Constraints (Intentional Deviations)

These are deliberate. Do not change without explicit product decision:

- No session expiry or refresh tokens
- No Supabase Auth (custom bcrypt only)
- No global toast/notification system
- No global error boundaries (ErrorBoundary wraps AppContent as a catch-all)
- Password stored in `User` interface for bcrypt comparison (stripped before localStorage)
- Basket state shared across tabs within the same app instance (separate keys for staff vs customer)

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_KEY` | ✅ | Supabase anon key |
| `VITE_ENVIRONMENT` | ❌ | `production` disables sign-up |
| `VITE_CACHE_DURATION_HOURS` | ❌ | Item cache TTL (default: 1) |
