import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test('landing page renders correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'InterMeet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'SignUp' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('landing page buttons navigate correctly', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'SignUp' }).click();
      await expect(page).toHaveURL(/\/auth\/signup/);

      await page.goto('/');
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page).toHaveURL(/\/auth\/login/);
  });
});
