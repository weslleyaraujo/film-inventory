import { signal } from '@preact/signals'
import { liveQuery } from 'dexie'
import { db } from '../db/db'
import type { FilmStock, FilmType } from '../db/types'

// ── Reactive signals ──

export const stocks = signal<FilmStock[]>([])
export const loading = signal(true)

// ── Live query ──

const stockObservable = liveQuery(() => db.filmStocks.toArray())

stockObservable.subscribe({
  next: (data) => {
    stocks.value = data
    loading.value = false
  },
  error: (err) => {
    console.error('Failed to load stocks:', err)
    loading.value = false
  },
})

// ── Actions ──

export async function addStock(stock: Omit<FilmStock, 'id' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
  await db.filmStocks.put({
    ...stock,
    id,
    createdAt: new Date(),
  })
  return id
}

export async function updateStock(
  id: string,
  updates: Partial<Omit<FilmStock, 'id' | 'createdAt'>>
): Promise<void> {
  await db.filmStocks.update(id, updates)
}

export async function deleteStock(id: string): Promise<void> {
  // Check if variants exist
  const variants = await db.filmVariants.where({ stockId: id }).toArray()
  if (variants.length > 0) {
    throw new Error(`Cannot delete stock with ${variants.length} variant(s). Delete variants first.`)
  }
  await db.filmStocks.delete(id)
}

// ── Lookups ──

export async function getStock(id: string): Promise<FilmStock | undefined> {
  return db.filmStocks.get(id)
}

export function getStockByIdSync(id: string): FilmStock | undefined {
  return stocks.value.find((s) => s.id === id)
}

export function getStocksByBrand(brand: string): FilmStock[] {
  return stocks.value.filter((s) => s.brand === brand)
}

export function getStocksByType(type: FilmType): FilmStock[] {
  return stocks.value.filter((s) => s.type === type)
}

export function getStocksByISO(iso: number): FilmStock[] {
  return stocks.value.filter((s) => s.iso === iso)
}
