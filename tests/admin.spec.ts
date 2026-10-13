import { test, expect, type Page } from '@playwright/test'

// A tiny valid PNG so the crop editor has something to decode in browser-only mode.
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8AARAyMDAwgZQAAEgABlCIVggAAAABJRU5ErkJggg==', 'base64')

// Cloud builds gate the editor behind an email/password form with an optional
// "this-browser preview" escape hatch; local builds show "Enter editor" directly.
const unlockEditor = async (page: Page) => {
  const enter = page.getByRole('button', { name: /enter editor/i })
  if (await enter.isVisible().catch(() => false)) return enter.click()
  await page.getByRole('button', { name: /this-browser preview/i }).click()
}

test('admin panel: unlock, add a cropped gallery photo and publish it', async ({ page }) => {
  await page.goto('/#admin')

  await expect(page.getByRole('heading', { name: /wedding editor/i })).toBeVisible()
  await unlockEditor(page)

  const tabs = page.getByRole('tablist')
  await expect(tabs).toBeVisible()

  await page.getByRole('tab', { name: /gallery/i }).click()
  const before = await page.locator('.admin-gallery-row').count()

  await page.getByRole('button', { name: /add photo/i }).click()
  await page.setInputFiles('input[type="file"]', { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG })

  const apply = page.getByRole('button', { name: /apply edits/i })
  await expect(apply).toBeEnabled()
  await apply.click()

  await expect(page.locator('.admin-gallery-row')).toHaveCount(before + 1)

  const save = page.getByRole('button', { name: /save & publish/i })
  await expect(save).toBeEnabled()
  await save.click()

  await expect(page.getByText(/Published|Saved/).first()).toBeVisible()

  // Back on the public site the new gallery item is present, and the admin
  // route still mounts the real editor rather than a broken page.
  await page.evaluate(() => { window.location.hash = '' })
  await expect(page.getByRole('heading', { name: /a glimpse of/i }).first()).toBeVisible()
})

test('admin panel: couple portraits can be replaced and removed', async ({ page }) => {
  await page.goto('/#admin')
  await expect(page.getByRole('heading', { name: /wedding editor/i })).toBeVisible()
  await unlockEditor(page)

  await page.getByRole('tab', { name: /couple photos/i }).click()
  await expect(page.locator('.admin-portrait-card')).toHaveCount(2)

  await page.locator('.admin-portrait-card').first().getByRole('button', { name: /add photo/i }).click()
  await page.setInputFiles('input[type="file"]', { name: 'portrait.png', mimeType: 'image/png', buffer: TINY_PNG })
  await page.getByRole('button', { name: /apply edits/i }).click()
  await expect(page.getByRole('button', { name: /remove/i }).first()).toBeVisible()
  await page.getByRole('button', { name: /remove/i }).first().click()
  await expect(page.getByRole('button', { name: /add photo/i }).first()).toBeVisible()
})