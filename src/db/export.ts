import { db } from './db'
import type { ExportData } from './types'

export async function exportDatabase(): Promise<ExportData> {
  const [filmStocks, filmVariants, inventoryItems, cameras, loadedFilms, finishedRolls] =
    await Promise.all([
      db.filmStocks.toArray(),
      db.filmVariants.toArray(),
      db.inventoryItems.toArray(),
      db.cameras.toArray(),
      db.loadedFilms.toArray(),
      db.finishedRolls.toArray(),
    ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    filmStocks,
    filmVariants,
    inventoryItems,
    cameras,
    loadedFilms,
    finishedRolls,
  }
}

export function downloadJSON(data: ExportData, filename?: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `film-inventory-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
