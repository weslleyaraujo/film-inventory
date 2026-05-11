import { signal, computed } from '@preact/signals'
import { liveQuery } from 'dexie'
import { db } from '../db/db'
import type { Camera, LoadedFilm, LoadedFilmWithDetails, FilmFormat } from '../db/types'
import { getCameraFormats } from '../db/types'
import { variantsWithStock } from './variants'
import { decrementQuantity } from './inventory'

// ── Reactive signals ──

export const cameras = signal<Camera[]>([])
export const loadedFilms = signal<LoadedFilm[]>([])
export const loading = signal(true)

// ── Live queries ──

const camerasObservable = liveQuery(() => db.cameras.toArray())
const loadedFilmsObservable = liveQuery(() => db.loadedFilms.toArray())

camerasObservable.subscribe({
  next: (data) => {
    cameras.value = data
    loading.value = false
  },
  error: (err) => {
    console.error('Failed to load cameras:', err)
    loading.value = false
  },
})

loadedFilmsObservable.subscribe({
  next: (data) => {
    loadedFilms.value = data
  },
  error: (err) => console.error('Failed to load loaded films:', err),
})

// ── Computed ──

/** Loaded films joined with variant, stock, and camera details */
export const loadedFilmsWithDetails = computed<LoadedFilmWithDetails[]>(() => {
  return loadedFilms.value
    .map((lf) => {
      const variant = variantsWithStock.value.find((v) => v.id === lf.variantId)
      const camera = cameras.value.find((c) => c.id === lf.cameraId)
      if (!variant || !camera) return null
      return { ...lf, variant, camera }
    })
    .filter((lf): lf is LoadedFilmWithDetails => lf !== null)
})

/** Get the loaded film for a specific camera */
export function getLoadedFilmByCamera(cameraId: string): LoadedFilmWithDetails | undefined {
  return loadedFilmsWithDetails.value.find((lf) => lf.cameraId === cameraId)
}

/** Check if a camera has film loaded */
export function isCameraLoaded(cameraId: string): boolean {
  return loadedFilms.value.some((lf) => lf.cameraId === cameraId)
}

// ── Camera helpers ──

/** Get supported formats for a camera (re-export from types for convenience) */
export { getCameraFormats }

/** Get formats for a camera by ID */
export function getFormatsForCamera(cameraId: string): FilmFormat[] {
  const camera = cameras.value.find((c) => c.id === cameraId)
  if (!camera) return []
  return getCameraFormats(camera.config)
}

// ── Camera Actions ──

export async function addCamera(camera: Omit<Camera, 'id' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
  await db.cameras.put({
    ...camera,
    id,
    createdAt: new Date(),
  })
  return id
}

export async function updateCamera(
  id: string,
  updates: Partial<Omit<Camera, 'id' | 'createdAt'>>
): Promise<void> {
  await db.cameras.update(id, updates)
}

export async function deleteCamera(id: string): Promise<void> {
  // Unload any film first
  const loaded = await db.loadedFilms.where({ cameraId: id }).first()
  if (loaded) {
    await db.loadedFilms.delete(loaded.id)
  }
  await db.cameras.delete(id)
}

// ── Loaded Film Actions ──

export async function loadFilm(
  cameraId: string,
  variantId: string,
  options?: { frameCount?: number; notes?: string; decrementInventory?: boolean }
): Promise<string> {
  // Check camera isn't already loaded
  const existing = await db.loadedFilms.where({ cameraId }).first()
  if (existing) {
    throw new Error('Camera already has film loaded. Finish the current roll first.')
  }

  const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
  await db.loadedFilms.put({
    id,
    cameraId,
    variantId,
    loadedAt: new Date(),
    frameCount: options?.frameCount,
    notes: options?.notes,
  })

  // Optionally decrement inventory
  if (options?.decrementInventory) {
    const items = await db.inventoryItems.where({ variantId }).toArray()
    const takenItem = items.find((i) => i.location === 'with-me')
    if (takenItem) {
      await decrementQuantity(takenItem.id)
    }
  }

  return id
}

export async function finishRoll(
  cameraId: string,
  options: {
    finishedAt?: Date
    rating?: number
    notes?: string
    twinCheckNumber?: string
    decrementInventory?: boolean
  }
): Promise<void> {
  const loaded = await db.loadedFilms.where({ cameraId }).first()
  if (!loaded) {
    throw new Error('No film loaded in this camera.')
  }

  // Get variant to know the format and optionally decrement
  const variant = await db.filmVariants.get(loaded.variantId)

  // Optionally decrement inventory
  if (options.decrementInventory && variant) {
    const items = await db.inventoryItems.where({ variantId: variant.id }).toArray()
    const takenItem = items.find((i) => i.location === 'with-me')
    if (takenItem) {
      await decrementQuantity(takenItem.id)
    }
  }

  // Create finished roll
  const finishedId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
  await db.finishedRolls.put({
    id: finishedId,
    variantId: loaded.variantId,
    cameraId,
    loadedAt: loaded.loadedAt,
    finishedAt: options.finishedAt ?? new Date(),
    frameCount: loaded.frameCount,
    rating: options.rating,
    notes: options.notes,
    twinCheckNumber: options.twinCheckNumber,
    createdAt: new Date(),
  })

  // Remove loaded film
  await db.loadedFilms.delete(loaded.id)
}

export async function unloadFilm(cameraId: string): Promise<void> {
  const loaded = await db.loadedFilms.where({ cameraId }).first()
  if (loaded) {
    await db.loadedFilms.delete(loaded.id)
  }
}
