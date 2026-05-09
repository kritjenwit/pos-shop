## Problem Statement

The POS Shop codebase has accumulated lint violations in test files, primarily due to use of `any` types which violates TypeScript best practices and the project's coding standards. Specifically, 15 lint errors were identified across 4 test files, making the codebase non-compliant with the established coding standards that emphasize type safety, descriptive naming, and clean code patterns.

Additionally, there is a need to implement a customer self-ordering menu feature that allows customers to browse the menu and place orders independently via a public-facing interface accessible through a QR code or link.

## Solution

### Coding Standards Upgrade
Upgrade the project to fully comply with the coding standards by eliminating all `any` type usages and unused variables in test files. This involves introducing proper typing with React types (`ReactNode`), creating reusable typed mock patterns, and exporting missing TypeScript interfaces. The solution maintains test behavior while enforcing type safety and code quality principles.

### Customer Self-Ordering Menu
Implement a customer self-ordering menu feature that allows customers to browse the menu and place orders independently via a public-facing interface accessible through a QR code or link. Orders from this interface will appear as pending orders requiring admin approval before processing.

## User Stories

### Coding Standards Upgrade
1. As a developer, I want zero lint errors in the codebase, so that I can maintain high code quality standards
2. As a developer, I want proper TypeScript types instead of `any`, so that type safety is enforced throughout the codebase
3. As a developer, I want test files to follow the same coding standards as production code, so that the entire codebase is consistent
4. As a developer, I want reusable typed mock patterns, so that future test files can follow the same approach
5. As a developer, I want the `AuthContextType` interface to be exported, so that it can be reused in test files and other modules
6. As a developer, I want unused variables to be removed, so that the code stays clean and warning-free
7. As a developer, I want all 87 existing tests to continue passing after the upgrade, so that functionality is not broken
8. As a developer, I want the build to pass with strict type-checking, so that type errors are caught early
9. As a maintainer, I want a typed `MockQueryBuilder` pattern for Supabase mocks, so that complex chained mock setups are type-safe
10. As a maintainer, I want proper `ReactNode` typing for mock component props, so that React component mocks follow React conventions

### Customer Self-Ordering Menu
1. As a customer, I want to browse the menu and place orders without staff assistance, so that I can order at my convenience
2. As a customer, I want to access the menu via a QR code or link provided by the shop, so that I can easily find the ordering interface
3. As an admin, I want to see all customer orders in a pending state, so that I can review and approve them before processing
4. As a customer, I want to optionally provide my name and contact information, so that the shop can contact me if needed
5. As an admin, I want to manage pending orders separately from completed orders, so that I can focus on orders requiring attention

## Implementation Decisions

### Coding Standards Upgrade
- **Modules modified**: `App.test.tsx`, `auth.test.ts`, `supabase.test.ts`, `ItemManagement.test.tsx`, `AuthContext.tsx`
- **New exported interface**: `AuthContextType` is now exported from `AuthContext.tsx` to enable proper typing in test files
- **Typed mock pattern**: Created a `MockQueryBuilder` type and `createMockBuilder` helper in `auth.test.ts` to replace `as any` casts with properly chained typed mocks
- **ReactNode usage**: Replaced `({ children }: any)` with `({ children }: { children: ReactNode })` in all test file mocks
- **Removed unused imports/variables**: Cleaned up `_file` and `_path` parameters in `supabase.test.ts`, removed unused `supabase` import in `auth.test.ts`
- **Build verification**: Both `npm run build` (TypeScript + Vite) and `npm run lint` pass cleanly after changes
- **Test verification**: All 87 tests pass after the refactoring

### Customer Self-Ordering Menu
- **Public menu route**: Create a new `/menu` route for public access to the self-ordering interface
- **Item display**: Show items using full item cards with images, names, prices, and add/remove controls (same as staff interface)
- **Basket management**: Use a separate basket for public menu orders (isolated from staff basket)
- **Customer info collection**: Collect optional customer name and mobile number before checkout
- **Order processing**: Orders created via the public menu start with status 'pending' and require admin approval
- **Admin interface**: Admins can view pending orders on a separate 'Pending Orders' page
- **Basket reset**: After order completion, the public basket is cleared and ready for the next customer
- **Access method**: Single static QR code/link for all customers (same menu for everyone)

## Testing Decisions

### Coding Standards Upgrade
- **What makes a good test**: Tests should verify external behavior (user-facing outcomes) not implementation details; mocks should be typed to catch regressions early
- **Modules tested**: The existing test files themselves were the subject of the upgrade — their internal mock patterns were refactored
- **Prior art**: Follows the existing Vitest + React Testing Library patterns already established in the codebase
- **Test behavior preserved**: All 87 tests pass after the upgrade, confirming no behavioral changes were introduced
- **Mock patterns**: The new `MockQueryBuilder` pattern is testable in isolation and can be extracted to a test utility if the pattern proves useful across more test files

### Customer Self-Ordering Menu
- **Unit tests**: Test the public menu component rendering, basket functionality, and order submission
- **Integration tests**: Test the flow from menu selection to order creation and pending status
- **E2E tests**: Test the complete customer journey from scanning QR code to order confirmation
- **Admin interface tests**: Test pending orders display and approval workflow

## Out of Scope

### Coding Standards Upgrade
- Fixing lint errors in non-test files (none exist currently)
- Adding new tests or expanding test coverage
- Refactoring production code for style (only `AuthContext.tsx` was modified to export a type)
- Changing the ESLint or TypeScript configuration
- Upgrading dependencies or changing the testing framework

### Customer Self-Ordering Menu
- Payment processing integration (uses existing PromptPay QR system)
- Receipt generation for customer orders (uses existing receipt upload system)
- Advanced analytics or reporting on customer orders
- Loyalty programs or discount systems
- Multi-language support for the public menu

## Further Notes

### Coding Standards Upgrade
- The `gh` CLI is not installed in the current environment, so this PRD was written to a file rather than published directly to GitHub Issues
- The coding standards skill references `rules/common/coding-style.md` which does not yet exist in the repo — consider creating it for reusable lint rules
- The `MockQueryBuilder` pattern in `auth.test.ts` could be extracted to `src/test-utils.ts` if similar typed mocks are needed in other test files
- The deprecation warning for `punycode` module is a Node.js/Vite dependency issue and is out of scope for this upgrade

### Customer Self-Ordering Menu
- No changes needed to existing database schema
- Orders will use the existing `transactions` table with `status` field set to 'pending' initially
- Customer name and mobile number can be stored in the `users` table fields (`full_name`, `phone`) when provided
- Public menu does not require authentication
- Menu only displays items (no access to management or checkout functions for staff)
- Admin approval required for all public menu orders before processing
- Input validation for customer name and mobile number fields
- UI/UX Details:
  - Public menu accessible at `/menu` route
  - Item display: Full item cards with images, names, prices, and quantity controls
  - Customer info collection: Optional name and mobile number fields before checkout
  - Order confirmation: Show order summary and clear basket after completion
  - Admin pending orders: Separate page showing all orders with status 'pending'
  - Order status styles: Pending (accent color), completed (primary color), cancelled (danger color)