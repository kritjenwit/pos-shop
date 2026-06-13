# ADR-0015: E2E Testing with Playwright

Added `playwright.config.ts` and `e2e/` test directory with 11 smoke-level E2E tests covering: login page rendering, page title, password visibility toggle, sign-in/sign-up mode switch, public /menu and /checkout routes, public transaction detail page, protected route redirect to login when unauthenticated, search placeholder display, and empty checkout state. Tests run against the dev server (`npm run dev`) via `npx playwright test`.

**Key constraint**: E2E tests require a running dev server with seeded data. They test basic rendering and navigation, not full database-backed flows. The `e2e/` directory is excluded from vitest config to avoid interference with unit tests. Playwright is installed as a devDependency; `playwright install chromium` must be run after install.
