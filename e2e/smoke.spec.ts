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
});
