import { signal, computed } from '@preact/signals'
import { liveQuery } from 'dexie'
import { db } from '../db/db'
import type { FilmVariant, FilmFormat, VariantWithStock } from '../db/types'
import { getStockByIdSync } from './stocks'

// ── Reactive signals ──

export const variants = signal<FilmVariant[]>([])
export const loading = signal(true)

// ── Live query ──

const variantObservable = liveQuery(() => db.filmVariants.toArray())

variantObservable.subscribe({
  next: (data) => {
    variants.value = data
    loading.value = false
  },
  error: (err) => {
    console.error('Failed to load variants:', err)
    loading.value = false
  },
})

// ── Computed ──

/** Variants joined with their parent stock */
export const variantsWithStock = computed<VariantWithStock[]>(() => {
  return variants.value.map((v) => ({
    ...v,
    stock: getStockByIdSync(v.stockId) ?? {
      id: v.stockId,
      name: 'Unknown',
      brand: 'Unknown',
      type: 'color-negative' as const,
      iso: 0,
      createdAt: new Date(),
    },
  }))
})

/** Variants grouped by stock ID */
export const variantsByStock = computed<Map<string, VariantWithStock[]>>(() => {
  const map = new Map<string, VariantWithStock[]>()
  for (const v of variantsWithStock.value) {
    const existing = map.get(v.stockId) ?? []
    existing.push(v)
    map.set(v.stockId, existing)
  }
  return map
})

/** Get variants for a specific stock */
export function getVariantsByStock(stockId: string): VariantWithStock[] {
  return variantsWithStock.value.filter((v) => v.stockId === stockId)
}

/** Get variants by format */
export function getVariantsByFormat(format: FilmFormat): VariantWithStock[] {
  return variantsWithStock.value.filter((v) => v.format === format)
}

// ── Actions ──

export async function addVariant(
  variant: Omit<FilmVariant, 'id' | 'createdAt'>
): Promise<string> {
  const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
  await db.filmVariants.put({
    ...variant,
    id,
    createdAt: new Date(),
  })
  return id
}

export async function updateVariant(
  id: string,
  updates: Partial<Omit<FilmVariant, 'id' | 'createdAt'>>
): Promise<void> {
  await db.filmVariants.update(id, updates)
}

export async function deleteVariant(id: string): Promise<void> {
  // Check if any inventory references this variant
  const items = await db.inventoryItems.where({ variantId: id }).toArray()
  if (items.length > 0) {
    // Delete associated inventory
    await db.inventoryItems.where({ variantId: id }).delete()
  }
  // Check if any loaded film references this variant
  const loaded = await db.loadedFilms.where({ variantId: id }).toArray()
  if (loaded.length > 0) {
    throw new Error('Cannot delete variant currently loaded in a camera. Finish the roll first.')
  }
  await db.filmVariants.delete(id)
}
