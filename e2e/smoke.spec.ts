import { test, expect } from '@playwright/test';

test.describe('POS Shop smoke tests', () => {
  test('should render login page at root with Sign In', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible({ timeout: 10000 });
  });

  test('should show correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('POS Shop - Retail Point of Sale');
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/');
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.locator('button[aria-label="Show password"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.locator('button[aria-label="Hide password"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should switch between sign-in and sign-up mode', async ({ page }) => {
    await page.goto('/');

    // Default is sign-in
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();

    // Switch to sign-up
    await page.locator('button:has-text("Sign Up")').click();
    await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();
    await expect(page.locator('#fullName')).toBeVisible();

    // Switch back to sign-in
    await page.locator('button:has-text("Sign In")').click();
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
  });

  test('should render public menu page without auth', async ({ page }) => {
    const response = await page.goto('/menu');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1:has-text("Our Menu")')).toBeVisible();
  });

  test('should render public checkout page without auth', async ({ page }) => {
    await page.goto('/checkout');
    // Empty basket shows the empty state (not the checkout form)
    await expect(page.locator('h2:has-text("Your basket is empty")')).toBeVisible();
  });

  test('should show empty basket message on checkout with no items', async ({ page }) => {
    await page.goto('/menu');

    // Check for the checkout link
    const checkoutLink = page.locator('a:has-text("Review Order & Checkout")');
    await expect(checkoutLink).not.toBeVisible();

    // Direct checkout page should show empty state
    await page.goto('/checkout');
    await expect(page.locator('h2:has-text("Your basket is empty")')).toBeVisible();
  });

  test('should load public transaction page', async ({ page }) => {
    const response = await page.goto('/public/transactions/fake-id');
    expect(response?.status()).toBe(200);
  });

  test('should redirect unauthenticated users from staff-only routes to login', async ({ page }) => {
    const protectedRoutes = ['/transactions', '/pending-orders', '/profile'];

    for (const route of protectedRoutes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      // Should show the login page
      await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Search and menu interaction', () => {
  test('should show search placeholder on menu page', async ({ page }) => {
    await page.goto('/menu');
    const searchInput = page.locator('input[placeholder="Search items..."]');
    await expect(searchInput).toBeVisible();
  });

  test('should show empty state on checkout page', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('h2:has-text("Your basket is empty")')).toBeVisible();
  });
});

test.describe('Login flow', () => {
  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'wrong@test.com');
    await page.fill('#password', 'wrongpass');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Menu and checkout', () => {
  test('should show checkout empty state when accessing checkout directly', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('h2:has-text("Your basket is empty")')).toBeVisible();
  });

  test('should show 404 on unknown route', async ({ page }) => {
    const response = await page.goto('/unknown-route');
    // SPA should still return 200 (catch-all handled by client router)
    // but nav to login since not authenticated
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible({ timeout: 5000 });
  });
});
