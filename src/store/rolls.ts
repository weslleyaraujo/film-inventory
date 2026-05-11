import { signal, computed } from '@preact/signals'
import { liveQuery } from 'dexie'
import { db } from '../db/db'
import type { FinishedRoll, FinishedRollWithDetails } from '../db/types'
import { variantsWithStock } from './variants'
import { cameras } from './cameras'

// ── Reactive signals ──

export const finishedRolls = signal<FinishedRoll[]>([])
export const loading = signal(true)

// ── Live query ──

const rollsObservable = liveQuery(() =>
  db.finishedRolls.orderBy('finishedAt').reverse().toArray()
)

rollsObservable.subscribe({
  next: (data) => {
    finishedRolls.value = data
    loading.value = false
  },
  error: (err) => {
    console.error('Failed to load finished rolls:', err)
    loading.value = false
  },
})

// ── Computed ──

/** Finished rolls joined with variant, stock, and camera */
export const finishedRollsWithDetails = computed<FinishedRollWithDetails[]>(() => {
  return finishedRolls.value
    .map((roll) => {
      const variant = variantsWithStock.value.find((v) => v.id === roll.variantId)
      const camera = cameras.value.find((c) => c.id === roll.cameraId)
      if (!variant || !camera) return null
      return { ...roll, variant, camera }
    })
    .filter((r): r is FinishedRollWithDetails => r !== null)
})

/** Rolls grouped by month (YYYY-MM) */
export const rollsByMonth = computed<Map<string, FinishedRollWithDetails[]>>(() => {
  const map = new Map<string, FinishedRollWithDetails[]>()
  for (const roll of finishedRollsWithDetails.value) {
    const key = roll.finishedAt.toISOString().slice(0, 7)
    const existing = map.get(key) ?? []
    existing.push(roll)
    map.set(key, existing)
  }
  return map
})

/** Total finished rolls */
export const totalFinishedRolls = computed<number>(() => finishedRolls.value.length)

/** Most-shot stock */
export const mostShotStock = computed<{ name: string; count: number } | null>(() => {
  const map = new Map<string, number>()
  for (const roll of finishedRollsWithDetails.value) {
    const name = roll.variant.stock.name
    map.set(name, (map.get(name) ?? 0) + 1)
  }
  let max = { name: '', count: 0 }
  for (const [name, count] of map) {
    if (count > max.count) max = { name, count }
  }
  return max.count > 0 ? max : null
})

/** Most-used camera */
export const mostUsedCamera = computed<{ name: string; count: number } | null>(() => {
  const map = new Map<string, number>()
  for (const roll of finishedRollsWithDetails.value) {
    const name = roll.camera.name
    map.set(name, (map.get(name) ?? 0) + 1)
  }
  let max = { name: '', count: 0 }
  for (const [name, count] of map) {
    if (count > max.count) max = { name, count }
  }
  return max.count > 0 ? max : null
})

// ── Actions ──

export async function deleteFinishedRoll(id: string): Promise<void> {
  await db.finishedRolls.delete(id)
}

export async function updateFinishedRoll(
  id: string,
  updates: Partial<Omit<FinishedRoll, 'id' | 'createdAt'>>
): Promise<void> {
  await db.finishedRolls.update(id, updates)
}

/** Get finished rolls for a specific stock */
export function getRollsByStock(stockId: string): FinishedRollWithDetails[] {
  return finishedRollsWithDetails.value.filter((r) => r.variant.stockId === stockId)
}

/** Get finished rolls for a specific camera */
export function getRollsByCamera(cameraId: string): FinishedRollWithDetails[] {
  return finishedRollsWithDetails.value.filter((r) => r.cameraId === cameraId)
}
