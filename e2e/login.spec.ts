import { expect, test } from '@playwright/test'

test.describe('Login (public)', () => {
  test('shows magic link form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})
