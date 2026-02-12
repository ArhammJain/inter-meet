import { test, expect } from '@playwright/test'

test.describe('Authentication Pages', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('h2')).toContainText('Sign in')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('signup page renders correctly', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.locator('h2')).toContainText('Create')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('login form shows validation for empty submit', async ({ page }) => {
    await page.goto('/auth/login')
    // HTML5 required validation prevents empty submit
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('navigate between login and signup', async ({ page }) => {
    await page.goto('/auth/login')
    await page.click('a[href="/auth/signup"]')
    await expect(page).toHaveURL(/\/auth\/signup/)
    await expect(page.locator('h2')).toContainText('Create')

    await page.click('a[href="/auth/login"]')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.locator('h2')).toContainText('Sign in')
  })

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    // Should redirect to login since not authenticated
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('auth error page renders', async ({ page }) => {
    await page.goto('/auth/auth-error')
    await expect(page.locator('text=Something went wrong')).toBeVisible()
  })
})
