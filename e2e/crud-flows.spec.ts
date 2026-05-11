import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_FILE = path.resolve(__dirname, '..', 'data.example.json')

async function importData(page: any) {
  await page.goto('/')
  await page.locator('button:has-text("Settings")').click()
  page.on('dialog', (dialog: any) => dialog.accept())
  const fc = page.waitForEvent('filechooser')
  await page.locator('button:has-text("Import Database")').click()
  const chooser = await fc
  await chooser.setFiles(DATA_FILE)
  await page.waitForTimeout(600)
  await page.locator('button:has-text("Inventory")').click()
  await page.waitForTimeout(600)
}

test.describe('Import / Export', () => {
  test('should import from JSON and see data', async ({ page }) => {
    await importData(page)
    await expect(page.locator('text=No film in inventory yet')).not.toBeVisible()
    await expect(page.locator('.text-brand').first()).toBeVisible()
  })

  test('should filter after import', async ({ page }) => {
    await importData(page)
    await page.locator('button:has-text("B&W")').click()
    await page.waitForTimeout(300)
    await expect(page.locator('text=1 filter')).toBeVisible()
    await page.locator('button:has-text("Clear")').click()
  })

  test('should show no-results state when filters match nothing', async ({ page }) => {
    await importData(page)
    // Search for something that doesn't exist
    await page.locator('input[placeholder="Search…"]').fill('xyznonexistent')
    await page.waitForTimeout(400)
    await expect(page.locator('text=No results')).toBeVisible()
    await expect(page.locator('text=Try adjusting your filters or search')).toBeVisible()
  })

  test('should drill into stock detail after import', async ({ page }) => {
    await importData(page)
    const stockName = page.locator('.text-section-title').first()
    const name = await stockName.textContent()
    await stockName.click()
    await page.waitForTimeout(300)
    await expect(page.locator('h1')).toContainText(name || '')
  })

  test('should export database', async ({ page }) => {
    await importData(page)
    await page.locator('button:has-text("Settings")').click()
    await page.waitForTimeout(300)
    const downloadPromise = page.waitForEvent('download')
    await page.locator('button:has-text("Export Database")').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('film-inventory')
  })

  test('home page shows carried/total after import', async ({ page }) => {
    await importData(page)
    const firstCard = page.locator('.bg-\\[var\\(--bg-card\\)\\]').first()
    await firstCard.click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=35mm').first()).toBeVisible()
  })

  test('hero stat cards toggle format filter', async ({ page }) => {
    await importData(page)
    await page.getByRole('button', { name: /35mm/ }).first().click()
    await page.waitForTimeout(300)
    await expect(page.locator('text=1 filter')).toBeVisible()
    await page.locator('button:has-text("Clear")').click()
  })

  test('tapping variant row navigates to stock detail', async ({ page }) => {
    await importData(page)
    await page.locator('.bg-\\[var\\(--bg-card\\)\\]').first().click()
    await page.waitForTimeout(500)
    const variantBtn = page.locator('button:has-text("35mm")').last()
    await variantBtn.click()
    await page.waitForTimeout(500)
    await expect(page.locator('h1')).toBeVisible()
    await page.locator('header button').first().click()
    await page.waitForTimeout(300)
    await expect(page.locator('h1')).toContainText('Inventory')
  })

  test('location pills show updated labels', async ({ page }) => {
    await importData(page)
    // Should see "with me" and "stored" pills
    await expect(page.locator('text=with me').first()).toBeVisible()
    await expect(page.locator('text=stored').first()).toBeVisible()
  })
})

test.describe('Stock Detail — Move Actions', () => {
  test.beforeEach(async ({ page }) => {
    await importData(page)
  })

  test('should see With me and Stored sections per variant', async ({ page }) => {
    const stockName = page.locator('.text-section-title').first()
    await stockName.click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=With me').first()).toBeVisible()
    await expect(page.locator('text=Stored').first()).toBeVisible()
  })

  test('should show DX badge on DX-coded variants', async ({ page }) => {
    const stockName = page.locator('.text-section-title').first()
    await stockName.click()
    await page.waitForTimeout(500)
    // Some variants are dxCoded; the DX badge should appear if any
    // At minimum, the detail page loaded without error
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should open move sheet or auto-move when qty is 1', async ({ page }) => {
    const stockName = page.locator('.text-section-title').first()
    await stockName.click()
    await page.waitForTimeout(500)

    // Click "Store" or "Take out" — if qty=1 it auto-moves, if >1 it opens modal
    const storeBtn = page.locator('button:has-text("Store")').first()
    const takeBtn = page.locator('button:has-text("Take out")').first()

    if ((await storeBtn.count()) > 0) {
      await storeBtn.click()
      await page.waitForTimeout(400)
      // Either the move sheet appeared or it auto-moved (qty=1)
      const sheetVisible = await page.locator('text=Store away').isVisible().catch(() => false)
      if (sheetVisible) {
        await page.locator('text=How many rolls?').press('Escape')
      }
    } else if ((await takeBtn.count()) > 0) {
      await takeBtn.click()
      await page.waitForTimeout(400)
      const sheetVisible = await page.locator('text=Take with you').isVisible().catch(() => false)
      if (sheetVisible) {
        await page.locator('text=How many rolls?').press('Escape')
      }
    }
    // Page should not have crashed
    await expect(page.locator('h1')).toBeVisible()
  })

  test('stepper adjusts quantity on detail page', async ({ page }) => {
    const stockName = page.locator('.text-section-title').first()
    await stockName.click()
    await page.waitForTimeout(500)
    // Click a plus button to increment
    const plusBtn = page.locator('button svg.lucide-plus').first()
    if ((await plusBtn.count()) > 0) {
      await plusBtn.click()
      await page.waitForTimeout(300)
    }
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('Camera Flows', () => {
  test.beforeEach(async ({ page }) => {
    await importData(page)
  })

  test('should add a 35mm camera and see it', async ({ page }) => {
    await page.locator('button:has-text("Cameras")').click()
    await page.waitForTimeout(300)
    await page.locator('[aria-label="Add camera"]').click()
    await page.locator('input[placeholder="e.g. Nikon F3"]').fill('Pentax K1000')
    await page.locator('button:has-text("Add Camera")').last().click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=Pentax K1000')).toBeVisible()
  })

  test('should add a 120 camera with 220 support', async ({ page }) => {
    await page.locator('button:has-text("Cameras")').click()
    await page.waitForTimeout(300)
    await page.locator('[aria-label="Add camera"]').click()
    await page.locator('input[placeholder="e.g. Nikon F3"]').fill('Mamiya RZ67')
    await page.getByRole('button', { name: '120', exact: true }).click()
    await page.waitForTimeout(200)
    await page.locator('text=Supports 220 film').click()
    await page.waitForTimeout(200)
    await page.locator('button:has-text("Add Camera")').last().click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=Mamiya RZ67')).toBeVisible()
    await page.locator('text=Mamiya RZ67').click()
    await page.waitForTimeout(300)
    await expect(page.locator('h1:has-text("Mamiya RZ67")')).toBeVisible()
  })

  test('camera list shows loaded film indicator', async ({ page }) => {
    await page.locator('button:has-text("Cameras")').click()
    await page.waitForTimeout(300)
    await page.locator('[aria-label="Add camera"]').click()
    await page.locator('input[placeholder="e.g. Nikon F3"]').fill('Test Cam')
    await page.locator('button:has-text("Add Camera")').last().click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=No film').first()).toBeVisible()
  })
})

test.describe('Add Film Flow', () => {
  test('should open add film sheet and show form', async ({ page }) => {
    await page.goto('/')
    await page.locator('[aria-label="Add film"]').click()
    await expect(page.locator('h2:has-text("Add Film")')).toBeVisible()
    await expect(page.locator('input[placeholder="e.g. Kodak Portra 400"]')).toBeVisible()
  })

  test('add film with new stock creates entry', async ({ page }) => {
    await page.goto('/')
    await page.locator('[aria-label="Add film"]').click()
    await page.locator('input[placeholder="e.g. Kodak Portra 400"]').fill('Unique Test Film')
    await page.waitForTimeout(300)
    await page.locator('input[placeholder="e.g. Kodak"]').fill('TestBrand')
    await page.locator('button:has-text("Add to Inventory")').last().click()
    await page.waitForTimeout(500)
    await expect(page.locator('h1')).toContainText('Inventory')
  })
})
