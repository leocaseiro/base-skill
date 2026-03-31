import { expect, test } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/BaseSkill/)
})

test('profile picker renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /profile picker/i })).toBeVisible()
})
