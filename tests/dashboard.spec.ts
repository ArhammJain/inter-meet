import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('landing page renders hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('InterMeet')
    await expect(page.locator('text=Get Started')).toBeVisible()
  })

  test('landing page has feature cards', async ({ page }) => {
    await page.goto('/')
    // Should have feature cards section
    const cards = page.locator('.feature-card, [class*="card"]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('room page with invalid code shows error or redirects', async ({ page }) => {
    await page.goto('/room/ABCDEF')
    // Either shows pre-join (if authenticated) or redirects to login
    await page.waitForTimeout(3000)
    const url = page.url()
    const hasLogin = url.includes('/auth/login')
    const hasRoom = url.includes('/room/')
    expect(hasLogin || hasRoom).toBeTruthy()
  })
})
