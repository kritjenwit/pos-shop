# 🤖 Agent Instructions (AGENTS.md)

Welcome, AI Agent! This document outlines the critical project standards, architectural patterns, and workflows you **must** follow when working on this POS Shop application. 

## 1. 🏗️ Architecture & Stack
- **Core:** React 19 + TypeScript + Vite.
- **Routing:** React Router 7 (nested routes in `src/App.tsx`).
- **Pages:** Login, ItemList (+ ItemManagement tab), Checkout, Profile, Transactions (list + detail).
- **State Management:** 
  - Contexts: `AuthContext` (auth state via `localStorage`), `AppContext` (app state + basket).
- **Deployment:** Cloudflare Workers.
- **Database:** Supabase (PostgreSQL).
  - *Rule:* All DB tables use UUID primary keys (`items`, `users`, `transactions`, `transaction_items`).

## 2. 🔐 Authentication & Security
- **Custom Auth:** Auth is handled **custom** via bcrypt + direct Supabase DB queries. Do **NOT** use Supabase Auth.
- **Auth Flow:** `src/lib/auth.ts` handles `signIn` and `signUp`.
- **Session:** User is stored in `localStorage` with the key `pos-shop-user`. No real session management.
- **Secrets:** `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`. **Never commit `.env` files.**

## 3. 💾 Data & Storage (Supabase)
- **Image Storage:** Supabase bucket `pos-shop` must be **private** with 4 RLS policies (SELECT, INSERT, UPDATE, DELETE for authenticated users).
- **Image Paths:** `Item.image` stores *file paths*, not URLs.
- **Image Resolution:** Use `getSignedImageUrl()` to resolve at render time. It returns passthrough for `data:`/`http` URLs. Signed URLs expire after 3600s (1 hour).
- **DB Migrations:** 
  - Known migration: `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;`

## 4. 🎨 Design System & UI
- **Colors:** Black/White/Gray palette. 
  - Primary: `#111111`, Background: `#F5F5F5`, Accent: `#333333`, Danger: `#EF4444`.
- **Typography:** Rubik (headings) + Nunito Sans (body) via Google Fonts in `index.html`.
- **Styling:** Vanilla CSS. Component classes are in `src/index.css`: 
  - Buttons: `.btn-primary`, `.btn-danger`, `.btn-secondary`, `.btn-ghost`
  - Elements: `.input-base`, `.card-base`, `.skeleton`
  - Modals: `.modal-backdrop`, `.modal-content`
- **Animations:** Defined in Tailwind config (`animate-fade-in`, `animate-scale-in`, `animate-slide-in`).

## 5. 🧑‍💻 Coding Standards & Patterns
- **Navigation:** Some pages use `window.location.href` instead of `useNavigate()` to force a reload. *Note: The ESLint `react-hooks/immutability` rule rejects mutating `window.location`, so ignore it when necessary.*
- **ESLint:** The rules `exhaustive-deps` and `set-state-in-effect` are OFF.
- **File Uploads:** `ItemForm` in the `ItemManagement` tab uses `FileReader` data URLs for new upload previews and signed URLs for existing images.

## 6. 🧪 Testing (Vitest)
- **Tools:** Vitest + React Testing Library.
- **Environment:** If tests fail with `localStorage is not defined` or `document is not defined`, add `{ test: { environment: 'jsdom' } }` to `vite.config.ts` or `vitest.config.ts`.
- **Mocks:** You must mock `supabase` and `auth` modules (refer to existing test files for patterns).

## 7. 🚀 Scripts & Commands
| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build with Vite. *Fix TS errors before linting.* |
| `npm run lint` | Run ESLint (flat config) |
| `npm run preview` | Build then run Wrangler dev |
| `npm run deploy` | Build then deploy via Wrangler |
| `npm run test:run` | Run Vitest tests once |
| `npm run test:coverage` | Run tests with coverage |

---

**⚠️ IMPORTANT:** Always verify types and fix TypeScript errors during implementation, as `npm run build` enforces strict type checking.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Labels follow the canonical names: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
