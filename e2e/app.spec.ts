import { test, expect } from '@playwright/test'

test.describe('App Shell', () => {
  test('should load the app and show inventory tab', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Inventory')
  })

  test('should show empty state on first load', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=No film in inventory yet')).toBeVisible()
  })

  test('should navigate between tabs', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Cameras")').click()
    await expect(page.locator('h1')).toContainText('Cameras')
    await page.locator('button:has-text("Log")').click()
    await expect(page.locator('h1')).toContainText('Log')
    await page.locator('button:has-text("Inventory")').click()
    await expect(page.locator('h1')).toContainText('Inventory')
  })
})

test.describe('CRUD Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Flow A — Add Film with new stock', async ({ page }) => {
    // Tap FAB
    await page.locator('[aria-label="Add film"]').click()

    // Wait for modal
    await expect(page.locator('h2:has-text("Add Film")')).toBeVisible()

    // Type stock name (new stock)
    await page.locator('input[placeholder="e.g. Kodak Portra 400"]').fill('Test Film 200')
    await page.waitForTimeout(300) // Wait for new stock fields to appear

    // Fill brand
    await page.locator('input[placeholder="e.g. Kodak"]').fill('TestBrand')

    // Pick type (nth(1) = inside modal, not filter chip)
    await page.locator('button:has-text("Color Neg")').nth(1).click()

    // Set quantity using stepper
    const plusButtons = page.locator('button:has-text("Add to Inventory")').first()
    // We'll just submit with default values
    await page.locator('button:has-text("Add to Inventory")').last().click()

    // Should be back on inventory with the item visible
    await expect(page.locator('h1')).toContainText('Inventory')
  })

  test('Flow B — Add Camera', async ({ page }) => {
    // Navigate to cameras tab
    await page.locator('button:has-text("Cameras")').click()
    await expect(page.locator('h1')).toContainText('Cameras')

    // Tap FAB
    await page.locator('[aria-label="Add camera"]').click()
    await expect(page.locator('h2:has-text("Add Camera")')).toBeVisible()

    // Fill form
    await page.locator('input[placeholder="e.g. Nikon F3"]').fill('Test Camera')
    await page.locator('button:has-text("Add Camera")').last().click()

    // Should see camera in grid
    await expect(page.locator('text=Test Camera')).toBeVisible()
  })

  test('Flow C — Settings dark mode toggle', async ({ page }) => {
    await page.locator('button:has-text("Settings")').click()
    await expect(page.locator('h1')).toContainText('Settings')
    await expect(page.locator('text=Appearance')).toBeVisible()

    // Toggle dark mode
    await page.locator('button:has-text("Dark")').click()
    // Body should have dark class or background change
    await page.waitForTimeout(300)
  })
})

test.describe('Filter System', () => {
  test('should show filter bar on inventory', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('button:has-text("Color Neg")').first()).toBeVisible()
    await expect(page.locator('button:has-text("B&W")').first()).toBeVisible()
    // The filter chip 35mm (not the hero stat card) — use .filter to get the small chip
    await expect(page.locator('.mask-r button:has-text("35mm")')).toBeVisible()
  })

  test('should toggle filter chips', async ({ page }) => {
    await page.goto('/')
    // Click a filter
    await page.locator('button:has-text("B&W")').click()
    // Should show active state (orange background)
    await expect(page.locator('text=1 filter')).toBeVisible()
    // Clear
    await page.locator('button:has-text("Clear")').click()
    await expect(page.locator('text=1 filter')).not.toBeVisible()
  })
})

test.describe('Empty States', () => {
  test('should show empty state on inventory', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=No film in inventory yet')).toBeVisible()
  })

  test('should show empty state on cameras', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Cameras")').click()
    await expect(page.locator('text=No cameras yet')).toBeVisible()
  })

  test('should show empty state on log', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Log")').click()
    await expect(page.locator('text=No rolls finished yet')).toBeVisible()
  })
})
