import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('@a11y accessibility', () => {
  test('home page has no detectable accessibility violations', async ({
    page,
  }) => {
    await page.goto('/')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
