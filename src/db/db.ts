import Dexie, { type Table } from 'dexie'
import type {
  FilmStock,
  FilmVariant,
  InventoryItem,
  Camera,
  LoadedFilm,
  FinishedRoll,
} from './types'

export class FilmInventoryDB extends Dexie {
  filmStocks!: Table<FilmStock, string>
  filmVariants!: Table<FilmVariant, string>
  inventoryItems!: Table<InventoryItem, string>
  cameras!: Table<Camera, string>
  loadedFilms!: Table<LoadedFilm, string>
  finishedRolls!: Table<FinishedRoll, string>

  constructor() {
    super('FilmInventory')

    this.version(2).stores({
      filmStocks: 'id, brand, type, iso',
      filmVariants: 'id, stockId, format',
      inventoryItems: 'id, variantId, location',
      cameras: 'id',
      loadedFilms: 'id, cameraId, variantId',
      finishedRolls: 'id, variantId, cameraId, finishedAt',
    })

    // Hook: auto-set updatedAt on inventory items
    this.inventoryItems.hook('creating', (_primKey, obj) => {
      obj.updatedAt = new Date()
    })
    this.inventoryItems.hook('updating', (mods) => {
      return { ...mods, updatedAt: new Date() }
    })

    // Hook: auto-set createdAt on stocks
    this.filmStocks.hook('creating', (_primKey, obj) => {
      obj.createdAt = new Date()
    })

    // Hook: auto-set createdAt on variants
    this.filmVariants.hook('creating', (_primKey, obj) => {
      obj.createdAt = new Date()
    })

    // Hook: auto-set createdAt on cameras
    this.cameras.hook('creating', (_primKey, obj) => {
      obj.createdAt = new Date()
    })

    // Hook: auto-set createdAt on finished rolls
    this.finishedRolls.hook('creating', (_primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date()
    })
  }
}

export const db = new FilmInventoryDB()
