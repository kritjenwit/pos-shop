## Parent

None (retrospective issue for completed work)

## What to build

A retrospective documentation issue recording the completed coding standards upgrade for the POS Shop project. This issue captures what was implemented, which user stories were satisfied, and serves as an audit trail for the work completed.

The upgrade eliminated all lint violations in test files by replacing `any` types with proper TypeScript types, removing unused variables, and creating reusable typed mock patterns.

## Acceptance criteria

- [x] All 15 lint errors in test files resolved (App.test.tsx, auth.test.ts, supabase.test.ts, ItemManagement.test.tsx)
- [x] `AuthContextType` interface exported from `AuthContext.tsx` for reuse in test files
- [x] `MockQueryBuilder` typed pattern created in `auth.test.ts` replacing `as any` casts
- [x] `ReactNode` type used in all mock component props instead of `any`
- [x] Unused variables (`_file`, `_path`) removed from `supabase.test.ts`
- [x] `npm run build` passes with no TypeScript errors
- [x] `npm run lint` passes with zero errors
- [x] All 87 tests pass after refactoring

## Blocked by

None - can start immediately (work is already complete)

## Retrospective Notes

### What was done
- **App.test.tsx**: Replaced `({ children }: any)` with `({ children }: { children: ReactNode })`; added `signIn`/`signUp` to mock return value to satisfy `AuthContextType`
- **auth.test.ts**: Rewrote mocks using a typed `MockQueryBuilder` pattern with `createMockBuilder()` helper; removed unused `supabase` import
- **supabase.test.ts**: Removed unused `_file` and `_path` parameters
- **ItemManagement.test.tsx**: Replaced `any` with `ReactNode` type; fixed `importOriginal` type to `typeof import()`
- **AuthContext.tsx**: Changed `interface AuthContextType` to `export interface AuthContextType`

### User stories satisfied
1. As a developer, I want zero lint errors in the codebase
2. As a developer, I want proper TypeScript types instead of `any`
3. As a developer, I want test files to follow the same coding standards
4. As a developer, I want reusable typed mock patterns
5. As a developer, I want `AuthContextType` exported for reuse
6. As a developer, I want unused variables removed
7. As a developer, I want all 87 tests to continue passing
8. As a developer, I want the build to pass with strict type-checking
9. As a maintainer, I want a typed `MockQueryBuilder` pattern
10. As a maintainer, I want proper `ReactNode` typing for mocks

### Modules modified
- `src/context/AuthContext.tsx` - exported `AuthContextType` interface
- `src/App.test.tsx` - proper typing for mocks
- `src/lib/auth.test.ts` - typed mock pattern
- `src/lib/supabase.test.ts` - removed unused vars
- `src/pages/ItemManagement/ItemManagement.test.tsx` - proper typing for mocks

### Out of scope (intentionally not done)
- Fixing lint errors in non-test files (none existed)
- Adding new tests or expanding coverage
- Refactoring production code for style
- Changing ESLint or TypeScript configuration
- Upgrading dependencies

### Future opportunities
- Create `rules/common/coding-style.md` for reusable lint rules
- Extract `MockQueryBuilder` pattern to `src/test-utils.ts` if pattern proves useful across more test files
- Install `gh` CLI for easier GitHub issue management
