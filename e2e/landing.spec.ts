import { expect, test } from '@playwright/test'

test.describe('Landing (public)', () => {
  test('shows hero and GitHub link without session', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /GitHub/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Empezar|Get started/i })).toBeVisible()
  })
})
