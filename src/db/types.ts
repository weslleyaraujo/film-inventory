export type FilmType = 'bw' | 'color-negative' | 'color-positive'

export type FilmFormat = '35mm' | '120' | '220'

export type Location = 'with-me' | 'fridge'

export type CameraConfig =
  | { type: '35mm' }
  | { type: '120'; supports220?: boolean }

export interface FilmStock {
  id: string
  name: string
  brand: string
  type: FilmType
  iso: number
  notes?: string
  createdAt: Date
}

export interface FilmVariant {
  id: string
  stockId: string
  name: string
  format: FilmFormat
  dxCoded: boolean
  notes?: string
  createdAt: Date
}

export interface InventoryItem {
  id: string
  variantId: string
  quantity: number
  location: Location
  updatedAt: Date
}

export interface Camera {
  id: string
  name: string
  config: CameraConfig
  notes?: string
  createdAt: Date
}

/** Derive supported formats from a camera's config. Falls back gracefully for legacy cameras. */
export function getCameraFormats(config: CameraConfig | undefined): FilmFormat[] {
  if (!config) return ['35mm'] // legacy fallback
  if (config.type === '35mm') return ['35mm']
  if (config.supports220) return ['120', '220']
  return ['120']
}

export interface LoadedFilm {
  id: string
  cameraId: string
  variantId: string
  loadedAt: Date
  frameCount?: number
  notes?: string
}

export interface FinishedRoll {
  id: string
  variantId: string
  cameraId: string
  loadedAt: Date
  finishedAt: Date
  frameCount?: number
  rating?: number
  notes?: string
  createdAt: Date
}

/** Joined entity for display: variant + stock + inventory */
export interface VariantWithStock extends FilmVariant {
  stock: FilmStock
}

/** Joined entity for inventory items with variant and stock */
export interface InventoryWithDetails extends InventoryItem {
  variant: VariantWithStock
}

/** Joined entity for loaded film with variant and stock */
export interface LoadedFilmWithDetails extends LoadedFilm {
  variant: VariantWithStock
  camera: Camera
}

/** Joined entity for finished roll with variant, stock, and camera */
export interface FinishedRollWithDetails extends FinishedRoll {
  variant: VariantWithStock
  camera: Camera
}

/** Analytics breakdowns */
export interface ISOBreakdown {
  iso: number
  count: number
}

export interface BrandBreakdown {
  brand: string
  count: number
  formats: FilmFormat[]
}

export interface TypeBreakdown {
  type: FilmType
  count: number
}

export interface FormatBreakdown {
  format: FilmFormat
  count: number
}

export interface LocationBreakdown {
  location: Location
  count: number
}

/** Export format */
export interface ExportData {
  version: 1
  exportedAt: string
  filmStocks: FilmStock[]
  filmVariants: FilmVariant[]
  inventoryItems: InventoryItem[]
  cameras: Camera[]
  loadedFilms: LoadedFilm[]
  finishedRolls: FinishedRoll[]
}
