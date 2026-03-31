import { expect, test } from '@playwright/test'

/** Hash router: home under default locale (preview build uses APP_BASE_URL=/). */
function localeHomeHash(locale: string): string {
  return `/#/${locale}/`
}

test('home page loads', async ({ page }) => {
  await page.goto(localeHomeHash('en'))
  await page.getByRole('main').waitFor({ state: 'visible' })
  await expect(page).toHaveTitle(/BaseSkill/)
})

test('profile picker renders', async ({ page }) => {
  await page.goto(localeHomeHash('en'))
  await page.getByRole('main').waitFor({ state: 'visible' })
  await expect(
    page.getByRole('heading', { name: /profile picker/i }),
  ).toBeVisible()
})
