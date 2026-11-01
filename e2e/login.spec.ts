import { expect, test } from '@playwright/test'

test.describe('Login (public)', () => {
  test('shows the login page', async ({ page }) => {
    await page.goto('/login')
    // The Clerk <SignIn /> widget needs a real Clerk instance, so only the page shell is asserted.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
