import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db/db'
import {
  addStock,
  updateStock,
  deleteStock,
  getStock,
  getStocksByBrand,
  getStocksByType,
} from '../store/stocks'
import {
  addVariant,
  updateVariant,
  deleteVariant,
} from '../store/variants'
import {
  addInventoryItem,
  incrementQuantity,
  decrementQuantity,
  moveInventory,
} from '../store/inventory'
import {
  addCamera,
  deleteCamera,
  loadFilm,
  finishRoll,
  unloadFilm,
} from '../store/cameras'
import { deleteFinishedRoll, updateFinishedRoll } from '../store/rolls'

// Helpers
async function clearAll() {
  await db.finishedRolls.clear()
  await db.loadedFilms.clear()
  await db.inventoryItems.clear()
  await db.filmVariants.clear()
  await db.cameras.clear()
  await db.filmStocks.clear()
}

describe('FilmStocks', () => {
  beforeEach(clearAll)

  it('should add a stock', async () => {
    const id = await addStock({ name: 'Kodak Portra 400', brand: 'Kodak', type: 'color-negative', iso: 400 })
    expect(id).toBeTruthy()
    const stock = await getStock(id)
    expect(stock?.name).toBe('Kodak Portra 400')
    expect(stock?.brand).toBe('Kodak')
    expect(stock?.type).toBe('color-negative')
    expect(stock?.iso).toBe(400)
  })

  it('should update a stock', async () => {
    const id = await addStock({ name: 'Test', brand: 'B', type: 'bw', iso: 100 })
    await updateStock(id, { name: 'Updated' })
    const stock = await getStock(id)
    expect(stock?.name).toBe('Updated')
  })

  it('should delete a stock with no variants', async () => {
    const id = await addStock({ name: 'Test', brand: 'B', type: 'bw', iso: 100 })
    await deleteStock(id)
    const stock = await getStock(id)
    expect(stock).toBeUndefined()
  })

  it('should block deleting stock with variants', async () => {
    const id = await addStock({ name: 'Test', brand: 'B', type: 'bw', iso: 100 })
    await addVariant({ stockId: id, name: 'Test 35mm', format: '35mm', dxCoded: false })
    await expect(deleteStock(id)).rejects.toThrow('variants')
  })

  it('should filter by brand', async () => {
    await addStock({ name: 'S1', brand: 'Kodak', type: 'bw', iso: 100 })
    await addStock({ name: 'S2', brand: 'Fujifilm', type: 'color-negative', iso: 200 })
    // Wait a bit for signal to update
    await new Promise((r) => setTimeout(r, 100))
    const kodak = getStocksByBrand('Kodak')
    expect(kodak.length).toBeGreaterThanOrEqual(1)
  })

  it('should filter by type', async () => {
    await addStock({ name: 'S1', brand: 'Kodak', type: 'bw', iso: 100 })
    await addStock({ name: 'S2', brand: 'Fuji', type: 'color-negative', iso: 200 })
    await new Promise((r) => setTimeout(r, 100))
    const bw = getStocksByType('bw')
    expect(bw.length).toBeGreaterThanOrEqual(1)
  })
})

describe('FilmVariants', () => {
  let stockId: string

  beforeEach(async () => {
    await clearAll()
    stockId = await addStock({ name: 'Kodak Portra 400', brand: 'Kodak', type: 'color-negative', iso: 400 })
  })

  it('should add a variant', async () => {
    const id = await addVariant({ stockId, name: 'Portra 400 35mm', format: '35mm', dxCoded: true })
    expect(id).toBeTruthy()
    const variant = await db.filmVariants.get(id)
    expect(variant?.name).toBe('Portra 400 35mm')
    expect(variant?.format).toBe('35mm')
  })

  it('should update a variant', async () => {
    const id = await addVariant({ stockId, name: 'V1', format: '35mm', dxCoded: false })
    await updateVariant(id, { name: 'Updated' })
    const v = await db.filmVariants.get(id)
    expect(v?.name).toBe('Updated')
  })

  it('should delete variant and its inventory', async () => {
    const vid = await addVariant({ stockId, name: 'V1', format: '35mm', dxCoded: false })
    await addInventoryItem({ variantId: vid, quantity: 5, location: 'with-me' })
    await deleteVariant(vid)
    const items = await db.inventoryItems.where({ variantId: vid }).toArray()
    expect(items.length).toBe(0)
  })
})

describe('Inventory', () => {
  let variantId: string

  beforeEach(async () => {
    await clearAll()
    const stockId = await addStock({ name: 'Test', brand: 'B', type: 'bw', iso: 100 })
    variantId = await addVariant({ stockId, name: 'Test 35mm', format: '35mm', dxCoded: false })
  })

  it('should add inventory item', async () => {
    const id = await addInventoryItem({ variantId, quantity: 3, location: 'with-me' })
    expect(id).toBeTruthy()
    const item = await db.inventoryItems.get(id)
    expect(item?.quantity).toBe(3)
    expect(item?.location).toBe('with-me')
  })

  it('should merge same variant+location', async () => {
    const id1 = await addInventoryItem({ variantId, quantity: 2, location: 'with-me' })
    const id2 = await addInventoryItem({ variantId, quantity: 3, location: 'with-me' })
    expect(id1).toBe(id2)
    const item = await db.inventoryItems.get(id1)
    expect(item?.quantity).toBe(5)
  })

  it('should increment quantity', async () => {
    const id = await addInventoryItem({ variantId, quantity: 1, location: 'with-me' })
    await incrementQuantity(id)
    const item = await db.inventoryItems.get(id)
    expect(item?.quantity).toBe(2)
  })

  it('should decrement and delete on zero', async () => {
    const id = await addInventoryItem({ variantId, quantity: 1, location: 'with-me' })
    await decrementQuantity(id)
    const item = await db.inventoryItems.get(id)
    expect(item).toBeUndefined()
  })

  it('should move inventory between locations', async () => {
    const id = await addInventoryItem({ variantId, quantity: 2, location: 'with-me' })
    await moveInventory(id, 'fridge')
    const item = await db.inventoryItems.get(id)
    expect(item?.location).toBe('fridge')
  })

  it('should merge when moving to existing location', async () => {
    const id1 = await addInventoryItem({ variantId, quantity: 2, location: 'with-me' })
    const id2 = await addInventoryItem({ variantId, quantity: 3, location: 'fridge' })
    await moveInventory(id1, 'fridge')
    // id1 should be deleted, id2 should have 5
    const item1 = await db.inventoryItems.get(id1)
    expect(item1).toBeUndefined()
    const item2 = await db.inventoryItems.get(id2)
    expect(item2?.quantity).toBe(5)
  })
})

describe('Cameras', () => {
  let cameraId: string
  let variantId: string

  beforeEach(async () => {
    await clearAll()
    cameraId = await addCamera({ name: 'Nikon F3', config: { type: '35mm' } })
    const stockId = await addStock({ name: 'Test', brand: 'B', type: 'bw', iso: 100 })
    variantId = await addVariant({ stockId, name: 'Test 35mm', format: '35mm', dxCoded: false })
    await addInventoryItem({ variantId, quantity: 5, location: 'with-me' })
  })

  it('should add a camera', async () => {
    const cam = await db.cameras.get(cameraId)
    expect(cam?.name).toBe('Nikon F3')
    expect(cam?.config).toEqual({ type: '35mm' })
  })

  it('getCameraFormats should derive formats from config', async () => {
    const { getCameraFormats } = await import('../db/types')
    expect(getCameraFormats({ type: '35mm' })).toEqual(['35mm'])
    expect(getCameraFormats({ type: '120' })).toEqual(['120'])
    expect(getCameraFormats({ type: '120', supports220: true })).toEqual(['120', '220'])
  })

  it('should load film into camera', async () => {
    await loadFilm(cameraId, variantId, { frameCount: 36 })
    const loaded = await db.loadedFilms.where({ cameraId }).first()
    expect(loaded).toBeTruthy()
    expect(loaded?.variantId).toBe(variantId)
    expect(loaded?.frameCount).toBe(36)
  })

  it('should block loading when camera already has film', async () => {
    await loadFilm(cameraId, variantId)
    await expect(loadFilm(cameraId, variantId)).rejects.toThrow('already has film')
  })

  it('should decrement inventory on load when requested', async () => {
    await loadFilm(cameraId, variantId, { decrementInventory: true })
    const items = await db.inventoryItems.where({ variantId }).toArray()
    const taken = items.find((i) => i.location === 'with-me')
    expect(taken?.quantity).toBe(4)
  })

  it('should finish roll and create log entry', async () => {
    await loadFilm(cameraId, variantId, { frameCount: 36 })
    await finishRoll(cameraId, { rating: 4, notes: 'Great!' })

    // Loaded film cleared
    const loaded = await db.loadedFilms.where({ cameraId }).first()
    expect(loaded).toBeUndefined()

    // Finished roll created
    const rolls = await db.finishedRolls.toArray()
    expect(rolls.length).toBe(1)
    expect(rolls[0].rating).toBe(4)
    expect(rolls[0].notes).toBe('Great!')
  })

  it('should unload film without creating log', async () => {
    await loadFilm(cameraId, variantId)
    await unloadFilm(cameraId)
    const loaded = await db.loadedFilms.where({ cameraId }).first()
    expect(loaded).toBeUndefined()
    const rolls = await db.finishedRolls.toArray()
    expect(rolls.length).toBe(0)
  })

  it('should allow deleting camera with no loaded film', async () => {
    await deleteCamera(cameraId)
    const cam = await db.cameras.get(cameraId)
    expect(cam).toBeUndefined()
  })
})

describe('Inventory detail-page moves', () => {
  let variantId: string

  beforeEach(async () => {
    await clearAll()
    const stockId = await addStock({ name: 'Test', brand: 'B', type: 'bw', iso: 100 })
    variantId = await addVariant({ stockId, name: 'Test 35mm', format: '35mm', dxCoded: false })
  })

  it('should move single roll from with-me to fridge', async () => {
    const id = await addInventoryItem({ variantId, quantity: 3, location: 'with-me' })
    await moveInventory(id, 'fridge', 1)
    const source = await db.inventoryItems.get(id)
    expect(source?.quantity).toBe(2)
    expect(source?.location).toBe('with-me')
    const dest = await db.inventoryItems.where({ variantId, location: 'fridge' }).first()
    expect(dest?.quantity).toBe(1)
  })

  it('should move single roll from fridge to with-me', async () => {
    const id = await addInventoryItem({ variantId, quantity: 4, location: 'fridge' })
    await moveInventory(id, 'with-me', 1)
    const source = await db.inventoryItems.get(id)
    expect(source?.quantity).toBe(3)
    expect(source?.location).toBe('fridge')
    const dest = await db.inventoryItems.where({ variantId, location: 'with-me' }).first()
    expect(dest?.quantity).toBe(1)
  })

  it('should merge when moving to existing location in detail flow', async () => {
    const carriedId = await addInventoryItem({ variantId, quantity: 2, location: 'with-me' })
    const fridgeId = await addInventoryItem({ variantId, quantity: 3, location: 'fridge' })
    // Move 1 from carried to fridge
    await moveInventory(carriedId, 'fridge', 1)
    const carried = await db.inventoryItems.get(carriedId)
    expect(carried?.quantity).toBe(1)
    const fridge = await db.inventoryItems.get(fridgeId)
    expect(fridge?.quantity).toBe(4)
  })
})

describe('Finished Rolls', () => {
  let cameraId: string
  let variantId: string

  beforeEach(async () => {
    await clearAll()
    cameraId = await addCamera({ name: 'Nikon F3', config: { type: '35mm' } })
    const stockId = await addStock({ name: 'Test Stock', brand: 'Kodak', type: 'color-negative', iso: 400 })
    variantId = await addVariant({ stockId, name: 'Test 35mm', format: '35mm', dxCoded: false })
    await addInventoryItem({ variantId, quantity: 5, location: 'with-me' })
    await loadFilm(cameraId, variantId, { frameCount: 36 })
    await finishRoll(cameraId, { rating: 4 })
  })

  it('should delete a finished roll', async () => {
    const rolls = await db.finishedRolls.toArray()
    await deleteFinishedRoll(rolls[0].id)
    const remaining = await db.finishedRolls.toArray()
    expect(remaining.length).toBe(0)
  })

  it('should update a finished roll', async () => {
    const rolls = await db.finishedRolls.toArray()
    await updateFinishedRoll(rolls[0].id, { rating: 5 })
    const updated = await db.finishedRolls.get(rolls[0].id)
    expect(updated?.rating).toBe(5)
  })
})

describe('Export/Import', () => {
  beforeEach(clearAll)

  it('should export empty database', async () => {
    const { exportDatabase } = await import('../db/export')
    const data = await exportDatabase()
    expect(data.version).toBe(1)
    expect(data.filmStocks).toEqual([])
  })

  it('should export and import round-trip', async () => {
    const { exportDatabase } = await import('../db/export')
    const { validateExportData, importDatabase } = await import('../db/import')

    // Add some data
    const stockId = await addStock({ name: 'Test', brand: 'B', type: 'bw', iso: 100 })
    const vid = await addVariant({ stockId, name: 'V1', format: '35mm', dxCoded: false })
    await addInventoryItem({ variantId: vid, quantity: 3, location: 'with-me' })

    // Export
    const data = await exportDatabase()
    expect(validateExportData(data)).toBe(true)
    expect(data.filmStocks.length).toBe(1)

    // Clear and import
    await clearAll()
    await importDatabase(data)

    const stocks = await db.filmStocks.toArray()
    expect(stocks.length).toBe(1)
    expect(stocks[0].name).toBe('Test')

    const items = await db.inventoryItems.toArray()
    expect(items.length).toBe(1)
    expect(items[0].quantity).toBe(3)
  })
})
