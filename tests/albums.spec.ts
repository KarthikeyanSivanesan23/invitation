import { test, expect, type Page } from '@playwright/test'

const unlockEditor = async (page: Page) => {
  const enter = page.getByRole('button', { name: /enter editor/i })
  if (await enter.isVisible().catch(() => false)) return enter.click()
  await page.getByRole('button', { name: /this-browser preview/i }).click()
}

test('albums: opens from the invitation navigation and renders the album wall', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /our album/i }).click()
  await expect(page).toHaveURL(/\/albums$/)
  await expect(page.getByRole('heading', { name: /moments, preserved/i })).toBeVisible()

  // The wall always renders: either real cards, the loading frames, or one of
  // the quiet empty/error states — never a blank page.
  await expect(page.locator('.alb-grid').or(page.locator('.alb-empty'))).toBeVisible()
})

test('albums: unknown album slugs fall back to a friendly error page', async ({ page }) => {
  await page.goto('/albums/not-a-real-album')
  await expect(page.getByText(/could not be loaded/i).or(page.getByText(/not found/i))).toBeVisible()
  await expect(page.getByRole('link', { name: /back to albums/i })).toBeVisible()
})

test('admin panel: wedding albums section opens from the sidebar', async ({ page }) => {
  await page.goto('/#admin')
  await expect(page.getByRole('heading', { name: /wedding editor/i })).toBeVisible()
  await unlockEditor(page)

  await page.getByRole('button', { name: /wedding albums/i }).click()
  await expect(page.getByRole('heading', { name: /wedding albums/i }).first()).toBeVisible()

  // New album entry point must exist when the cloud is connected; in browser
  // preview the section politely explains that albums need Supabase.
  await expect(page.getByRole('button', { name: /new album/i })
    .or(page.getByText(/albums need the supabase connection/i)))
    .toBeVisible()
})