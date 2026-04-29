# Profile Page Implementation Plan

**Created:** 2026-04-29  
**Feature:** Add profile page with fullname, email (read-only), and phone number

## Overview

Add a Profile page accessible by clicking the profile name/email in the navbar. The page displays fullname, email (disabled), and phone number (editable). Phone number is used to autofill the QR code on the checkout page but remains changeable.

## Steps

### 1. Database Migration - Add Phone Column

- Add `phone` column to `users` table (type: text, nullable)
- SQL: `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;`
- Update Supabase TypeScript types if using generated types

### 2. Update User Interface

- File: `src/lib/supabase.ts`
- Add `phone?: string` to the `User` interface:
  ```typescript
  export interface User {
    id: string;
    email: string;
    password: string;
    full_name: string | null;
    phone?: string | null;
    created_at: string;
  }
  ```

### 3. Create Profile Page Component

- File: `src/pages/Profile/ProfilePage.tsx` (new)
- Display:
  - Full name (read-only text or disabled input)
  - Email (disabled input - unique key, not editable)
  - Phone number (editable input with save button)
- Fetch user profile on mount using `useAuth()` to get user ID
- Update phone via Supabase client on save
- Include validation for phone format
- Show loading/success/error states

### 4. Add Profile Route

- File: `src/App.tsx`
- Import `ProfilePage` component
- Add route: `<Route path="/profile" element={<ProfilePage />} />`
- Make the user email/name in navbar clickable: wrap with `<Link to="/profile">`

### 5. Update Navbar

- File: `src/App.tsx`
- Change the user display span from static text to a Link:
  ```typescript
  <Link to="/profile" className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity" style={{ color: COLORS.textSecondary }}>
    <User size={16} />
    {user.full_name || user.email}
  </Link>
  ```

### 6. Update Checkout Page to Use Profile Phone

- File: `src/pages/Checkout/Checkout.tsx`
- Import `useAuth` to get current user
- Initialize `promptPayTarget` state with user's phone if available:
  ```typescript
  const { user } = useAuth();
  const [promptPayTarget, setPromptPayTarget] = useState(user?.phone || '');
  ```
- The phone field remains editable at checkout

### 7. Testing

- Create `src/pages/Profile/ProfilePage.test.tsx`
- Test profile loads with user data
- Test phone update functionality
- Test email field is disabled
- Update `src/pages/Checkout/Checkout.test.tsx` to verify phone autofill from profile

### 8. Run Type Check and Lint

- Run `npm run build` to ensure TypeScript compilation passes
- Run `npm run lint` to ensure no linting errors

## Files to Modify/Create

- `src/lib/supabase.ts` - Update User interface
- `src/App.tsx` - Add route and update navbar
- `src/pages/Profile/ProfilePage.tsx` - New file
- `src/pages/Profile/ProfilePage.test.tsx` - New file
- `src/pages/Checkout/Checkout.tsx` - Autofill phone from profile

## Acceptance Criteria

- Profile page accessible from navbar
- Displays fullname, email (disabled), phone (editable)
- Phone saves to database
- Checkout QR code autofills with profile phone
- All tests pass
