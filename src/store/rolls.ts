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

// ── Stats / Breakdowns ──

/** Total frames captured across all finished rolls */
export const totalFrames = computed<number>(() =>
  finishedRollsWithDetails.value.reduce((sum, r) => sum + (r.frameCount ?? 0), 0)
)

/** Breakdown by film type */
export const breakdownByType = computed<{ type: string; count: number }[]>(() => {
  const map = new Map<string, number>()
  for (const roll of finishedRollsWithDetails.value) {
    const t = roll.variant.stock.type
    map.set(t, (map.get(t) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
})

/** Breakdown by format */
export const breakdownByFormat = computed<{ format: string; count: number }[]>(() => {
  const map = new Map<string, number>()
  for (const roll of finishedRollsWithDetails.value) {
    const f = roll.variant.format
    map.set(f, (map.get(f) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([format, count]) => ({ format, count }))
    .sort((a, b) => b.count - a.count)
})

/** Breakdown by brand */
export const breakdownByBrand = computed<{ brand: string; count: number }[]>(() => {
  const map = new Map<string, number>()
  for (const roll of finishedRollsWithDetails.value) {
    const b = roll.variant.stock.brand
    map.set(b, (map.get(b) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
})

/** Breakdown by ISO */
export const breakdownByISO = computed<{ iso: number; count: number }[]>(() => {
  const map = new Map<number, number>()
  for (const roll of finishedRollsWithDetails.value) {
    const iso = roll.variant.stock.iso
    map.set(iso, (map.get(iso) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([iso, count]) => ({ iso, count }))
    .sort((a, b) => a.iso - b.iso)
})

/** Top 5 most-shot stocks */
export const topStocks = computed<{ name: string; brand: string; count: number }[]>(() => {
  const map = new Map<string, { name: string; brand: string; count: number }>()
  for (const roll of finishedRollsWithDetails.value) {
    const s = roll.variant.stock
    const entry = map.get(s.id) ?? { name: s.name, brand: s.brand, count: 0 }
    entry.count++
    map.set(s.id, entry)
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

/** Rolls per month for the last 12 months (includes months with 0) */
export const rollsByMonthLast12 = computed<{ month: string; count: number }[]>(() => {
  const now = new Date()
  const countByKey = new Map<string, number>()
  for (const roll of finishedRollsWithDetails.value) {
    const key = roll.finishedAt.toISOString().slice(0, 7)
    countByKey.set(key, (countByKey.get(key) ?? 0) + 1)
  }
  const months: { yyyymm: string; label: string }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      yyyymm: d.toISOString().slice(0, 7),
      label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
    })
  }
  return months.map((m) => ({
    month: m.label,
    count: countByKey.get(m.yyyymm) ?? 0,
  }))
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
