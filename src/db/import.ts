import { db } from './db'
import type { ExportData } from './types'

export function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  if (d.version !== 1) return false
  if (!Array.isArray(d.filmStocks)) return false
  if (!Array.isArray(d.filmVariants)) return false
  if (!Array.isArray(d.inventoryItems)) return false
  if (!Array.isArray(d.cameras)) return false
  if (!Array.isArray(d.loadedFilms)) return false
  if (!Array.isArray(d.finishedRolls)) return false

  return true
}

export async function importDatabase(data: ExportData): Promise<void> {
  // Clear all existing data
  await db.transaction(
    'rw',
    [
      db.filmStocks,
      db.filmVariants,
      db.inventoryItems,
      db.cameras,
      db.loadedFilms,
      db.finishedRolls,
    ],
    async () => {
      await db.finishedRolls.clear()
      await db.loadedFilms.clear()
      await db.inventoryItems.clear()
      await db.filmVariants.clear()
      await db.cameras.clear()
      await db.filmStocks.clear()

      // Import in order (respect foreign keys)
      await db.filmStocks.bulkPut(data.filmStocks)
      await db.filmVariants.bulkPut(data.filmVariants)
      await db.inventoryItems.bulkPut(data.inventoryItems)
      await db.cameras.bulkPut(data.cameras)
      await db.loadedFilms.bulkPut(data.loadedFilms)
      await db.finishedRolls.bulkPut(data.finishedRolls)
    }
  )
}
