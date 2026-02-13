import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByPlaceholder('name@work.com')).toBeVisible(); // Login email placeholder
    await expect(page.getByPlaceholder('••••••••')).toBeVisible(); // Login password placeholder
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('signup page renders correctly', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    await expect(page.getByPlaceholder('name@work.com')).toBeVisible(); // Signup email placeholder
    await expect(page.getByPlaceholder('Min 6 characters')).toBeVisible(); // Signup password placeholder
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
  });

  test('navigate between login and signup', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: 'Create one' }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });
});
