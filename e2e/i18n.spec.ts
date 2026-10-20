import { expect, test } from '@playwright/test'
import { mockCounter } from './support'

test.beforeEach(async ({ page }) => {
  await mockCounter(page)
})

test.describe('in a Spanish browser', () => {
  test.use({ locale: 'es-MX' })

  test('shows the Spanish page', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Reduce tus imágenes' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page).toHaveTitle(/Comprime archivos/)
  })
})

test.describe('in an Arabic browser', () => {
  test.use({ locale: 'ar-EG' })

  test('lays the page out right to left', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'صغّر حجم صورك' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    // The digits of the counter still read left to right
    await expect(page.locator('.rolling-number').first()).toHaveAttribute('dir', 'ltr')
  })
})

test.describe('in a browser language without a translation', () => {
  test.use({ locale: 'ja-JP' })

  test('falls back to English', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Shrink your images' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('remembers a language picked in the footer', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('combobox', { name: 'Language' }).selectOption('Deutsch')

    await expect(page.getByRole('heading', { name: 'Bilder verkleinern' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Bilder verkleinern' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Sprache' })).toHaveValue('de')
  })
})

test.describe('on a small phone', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  // Translations make the footer links much longer than in English
  for (const code of ['en', 'de', 'es', 'fr', 'pt-BR', 'ar', 'hi', 'bn', 'zh-Hans']) {
    test(`fits the footer links on the screen in ${code}`, async ({ page }) => {
      await page.addInitScript((locale) => localStorage.setItem('locale', locale), code)
      await page.goto('/contact')

      const contact = page.locator('footer').getByRole('link').nth(4)
      await contact.scrollIntoViewIfNeeded()
      await expect(contact).toBeInViewport({ ratio: 1 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
    })
  }
})
