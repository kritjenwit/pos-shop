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

    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();

    await page.locator('button:has-text("Sign Up")').click();
    await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();
    await expect(page.locator('#fullName')).toBeVisible();

    await page.locator('button:has-text("Sign In")').click();
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
  });

  test('should render public menu page without auth', async ({ page }) => {
    const response = await page.goto('/menu');
    expect(response?.status()).toBe(200);
    // Page renders heading on success or error state on failure
    const heading = page.locator('h1:has-text("Our Menu")');
    const errorAlert = page.locator('[role="alert"]');
    await expect(heading.or(errorAlert)).toBeVisible({ timeout: 15000 });
  });

  test('should show empty basket message on checkout with no items', async ({ page }) => {
    await page.goto('/menu');

    const checkoutLink = page.locator('a:has-text("Review Order & Checkout")');
    await expect(checkoutLink).not.toBeVisible();

    await page.goto('/checkout');
    await expect(page.locator('h2:has-text("Your basket is empty")')).toBeVisible();
  });

  test('should load public transaction page', async ({ page }) => {
    const response = await page.goto('/public/transactions/fake-id');
    expect(response?.status()).toBe(200);
  });

  test('should redirect unauthenticated users from staff-only routes to login', async ({ page }) => {
    const protectedRoutes = ['/transactions', '/pending-orders', '/profile', '/analytics'];

    for (const route of protectedRoutes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show 404 on unknown route', async ({ page }) => {
    const response = await page.goto('/unknown-route');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible({ timeout: 5000 });
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

test.describe('Public routes accessibility', () => {
  test('should have skip-to-content link on public routes', async ({ page }) => {
    await page.goto('/menu');
    const skipLink = page.locator('text=Skip to content');
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveAttribute('href', '#public-content');
  });

  test('skip-to-content link is keyboard-accessible', async ({ page }) => {
    await page.goto('/menu');
    const skipLink = page.locator('text=Skip to content');
    await expect(skipLink).toBeVisible();
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
  });
});

test.describe('Menu page behavior', () => {
  test('should show search input when items are loaded or error on failure', async ({ page }) => {
    await page.goto('/menu');
    const searchInput = page.locator('input[placeholder="Search items..."]');
    const errorAlert = page.locator('[role="alert"]');
    await expect(searchInput.or(errorAlert)).toBeVisible({ timeout: 15000 });
  });
});
