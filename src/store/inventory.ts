import { signal, computed } from '@preact/signals'
import { liveQuery } from 'dexie'
import { db } from '../db/db'
import type {
  InventoryItem,
  InventoryWithDetails,
  Location,
  ISOBreakdown,
  BrandBreakdown,
  TypeBreakdown,
  FormatBreakdown,
  LocationBreakdown,
} from '../db/types'
import { variantsWithStock } from './variants'
import { filterState } from './ui'

// ── Reactive signals ──

export const inventoryItems = signal<InventoryItem[]>([])
export const loading = signal(true)

// ── Live query ──

const inventoryObservable = liveQuery(() => db.inventoryItems.toArray())

inventoryObservable.subscribe({
  next: (data) => {
    inventoryItems.value = data
    loading.value = false
  },
  error: (err) => {
    console.error('Failed to load inventory:', err)
    loading.value = false
  },
})

// ── Computed: Joined data ──

/** Inventory items with variant + stock details */
export const inventoryWithDetails = computed<InventoryWithDetails[]>(() => {
  return inventoryItems.value
    .map((item) => {
      const variant = variantsWithStock.value.find((v) => v.id === item.variantId)
      if (!variant) return null
      return { ...item, variant }
    })
    .filter((i): i is InventoryWithDetails => i !== null && i.quantity > 0)
})

/** Inventory items filtered by location */
export const inventoryByLocation = computed<Map<Location, InventoryWithDetails[]>>(() => {
  const map = new Map<Location, InventoryWithDetails[]>()
  map.set('with-me', [])
  map.set('fridge', [])
  for (const item of inventoryWithDetails.value) {
    map.get(item.location)?.push(item)
  }
  return map
})

// ── Computed: Stats ──

/** Total roll count */
export const totalRolls = computed<number>(() =>
  inventoryWithDetails.value.reduce((sum, i) => sum + i.quantity, 0)
)

/** Total 35mm rolls */
export const total35mm = computed<number>(() =>
  inventoryWithDetails.value
    .filter((i) => i.variant.format === '35mm')
    .reduce((sum, i) => sum + i.quantity, 0)
)

/** Total 120 rolls */
export const total120 = computed<number>(() =>
  inventoryWithDetails.value
    .filter((i) => i.variant.format === '120')
    .reduce((sum, i) => sum + i.quantity, 0)
)

/** Total 220 rolls */
export const total220 = computed<number>(() =>
  inventoryWithDetails.value
    .filter((i) => i.variant.format === '220')
    .reduce((sum, i) => sum + i.quantity, 0)
)

/** Total with-me rolls */
export const totalWithMe = computed<number>(() =>
  inventoryWithDetails.value
    .filter((i) => i.location === 'with-me')
    .reduce((sum, i) => sum + i.quantity, 0)
)

/** Total fridge rolls */
export const totalFridge = computed<number>(() =>
  inventoryWithDetails.value
    .filter((i) => i.location === 'fridge')
    .reduce((sum, i) => sum + i.quantity, 0)
)

// ── Computed: Breakdowns ──

/** Breakdown by ISO */
export const breakdownByISO = computed<ISOBreakdown[]>(() => {
  const map = new Map<number, number>()
  for (const item of inventoryWithDetails.value) {
    const iso = item.variant.stock.iso
    map.set(iso, (map.get(iso) ?? 0) + item.quantity)
  }
  return Array.from(map.entries())
    .map(([iso, count]) => ({ iso, count }))
    .sort((a, b) => a.iso - b.iso)
})

/** Breakdown by brand */
export const breakdownByBrand = computed<BrandBreakdown[]>(() => {
  const map = new Map<string, { count: number; formats: Set<string> }>()
  for (const item of inventoryWithDetails.value) {
    const brand = item.variant.stock.brand
    const entry = map.get(brand) ?? { count: 0, formats: new Set() }
    entry.count += item.quantity
    entry.formats.add(item.variant.format)
    map.set(brand, entry)
  }
  return Array.from(map.entries())
    .map(([brand, data]) => ({
      brand,
      count: data.count,
      formats: Array.from(data.formats) as InventoryWithDetails['variant']['format'][],
    }))
    .sort((a, b) => b.count - a.count)
})

/** Breakdown by film type */
export const breakdownByType = computed<TypeBreakdown[]>(() => {
  const map = new Map<string, number>()
  for (const item of inventoryWithDetails.value) {
    const type = item.variant.stock.type
    map.set(type, (map.get(type) ?? 0) + item.quantity)
  }
  return Array.from(map.entries())
    .map(([type, count]) => ({ type: type as TypeBreakdown['type'], count }))
    .sort((a, b) => b.count - a.count)
})

/** Breakdown by format */
export const breakdownByFormat = computed<FormatBreakdown[]>(() => {
  const map = new Map<string, number>()
  for (const item of inventoryWithDetails.value) {
    const format = item.variant.format
    map.set(format, (map.get(format) ?? 0) + item.quantity)
  }
  return Array.from(map.entries())
    .map(([format, count]) => ({ format: format as FormatBreakdown['format'], count }))
    .sort((a, b) => b.count - a.count)
})

/** Breakdown by location */
export const breakdownByLocation = computed<LocationBreakdown[]>(() => {
  const map = new Map<string, number>()
  map.set('with-me', totalWithMe.value)
  map.set('fridge', totalFridge.value)
  return Array.from(map.entries())
    .map(([location, count]) => ({ location: location as Location, count }))
    .sort((a, b) => b.count - a.count)
})

// ── Actions ──

export async function addInventoryItem(
  item: Omit<InventoryItem, 'id' | 'updatedAt'>
): Promise<string> {
  // Check if item already exists for this variant + location
  const existing = await db.inventoryItems
    .where({ variantId: item.variantId, location: item.location })
    .first()

  if (existing) {
    // Increment quantity
    await db.inventoryItems.update(existing.id, {
      quantity: existing.quantity + item.quantity,

    })
    return existing.id
  }

  const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
  await db.inventoryItems.put({
    ...item,
    id,
    updatedAt: new Date(),
  })
  return id
}

export async function updateInventoryQuantity(id: string, quantity: number): Promise<void> {
  if (quantity <= 0) {
    await db.inventoryItems.delete(id)
  } else {
    await db.inventoryItems.update(id, { quantity })
  }
}

export async function incrementQuantity(id: string): Promise<void> {
  const item = await db.inventoryItems.get(id)
  if (item) {
    await db.inventoryItems.update(id, { quantity: item.quantity + 1 })
  }
}

export async function decrementQuantity(id: string): Promise<void> {
  const item = await db.inventoryItems.get(id)
  if (item && item.quantity > 1) {
    await db.inventoryItems.update(id, { quantity: item.quantity - 1 })
  } else if (item) {
    await db.inventoryItems.delete(id)
  }
}

export async function moveInventory(id: string, newLocation: Location, qty?: number): Promise<void> {
  const item = await db.inventoryItems.get(id)
  if (!item || item.location === newLocation) return

  const moveQty = qty ?? item.quantity
  if (moveQty <= 0 || moveQty > item.quantity) return

  // Check if there's already an inventory item at the new location for this variant
  const existing = await db.inventoryItems
    .where({ variantId: item.variantId, location: newLocation })
    .first()

  if (moveQty >= item.quantity) {
    // Move all
    if (existing) {
      await db.inventoryItems.update(existing.id, {
        quantity: existing.quantity + item.quantity,
      })
      await db.inventoryItems.delete(id)
    } else {
      await db.inventoryItems.update(id, { location: newLocation })
    }
  } else {
    // Move partial: reduce source, increase or create destination
    await db.inventoryItems.update(id, {
      quantity: item.quantity - moveQty,
    })
    if (existing) {
      await db.inventoryItems.update(existing.id, {
        quantity: existing.quantity + moveQty,
      })
    } else {
      await db.inventoryItems.put({
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        variantId: item.variantId,
        quantity: moveQty,
        location: newLocation,
        updatedAt: new Date(),
      })
    }
  }
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await db.inventoryItems.delete(id)
}

/** Get inventory for a specific variant */
export async function getInventoryByVariant(variantId: string): Promise<InventoryItem[]> {
  return db.inventoryItems.where({ variantId }).toArray()
}

// ── Filtered inventory ──

/** Apply all active filters to inventory */
export const filteredInventory = computed<InventoryWithDetails[]>(() => {
  const f = filterState.value
  return inventoryWithDetails.value.filter((item) => {
    if (f.type && item.variant.stock.type !== f.type) return false
    if (f.iso && item.variant.stock.iso !== f.iso) return false
    if (f.brand && item.variant.stock.brand.toLowerCase() !== f.brand.toLowerCase()) return false
    if (f.format && item.variant.format !== f.format) return false
    if (f.location && item.location !== f.location) return false
    if (f.search.trim()) {
      const q = f.search.toLowerCase()
      const haystack = [
        item.variant.name,
        item.variant.stock.name,
        item.variant.stock.brand,
        item.variant.format,
      ].join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
})

/** Filtered total roll count */
export const filteredTotalRolls = computed<number>(() =>
  filteredInventory.value.reduce((sum, i) => sum + i.quantity, 0)
)

/** Filtered 35mm count */
export const filteredTotal35mm = computed<number>(() =>
  filteredInventory.value
    .filter((i) => i.variant.format === '35mm')
    .reduce((sum, i) => sum + i.quantity, 0)
)

/** Filtered 120 count */
export const filteredTotal120 = computed<number>(() =>
  filteredInventory.value
    .filter((i) => i.variant.format === '120')
    .reduce((sum, i) => sum + i.quantity, 0)
)

/** Filtered with-me count */
export const filteredWithMe = computed<number>(() =>
  filteredInventory.value
    .filter((i) => i.location === 'with-me')
    .reduce((sum, i) => sum + i.quantity, 0)
)

/** Filtered fridge count */
export const filteredFridge = computed<number>(() =>
  filteredInventory.value
    .filter((i) => i.location === 'fridge')
    .reduce((sum, i) => sum + i.quantity, 0)
)
