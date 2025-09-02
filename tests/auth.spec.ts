import { test, expect } from '@playwright/test';

test.describe('Auth smoke (UI reaches pages)', () => {
  test('Signup page loads', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page).toHaveTitle(/v0 App/i);
  });

  test('Login page loads', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/v0 App/i);
  });
});


