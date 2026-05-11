import { signal, computed } from '@preact/signals'
import type { FilmType, FilmFormat, Location } from '../db/types'

// ── Persistent preference helpers ──

function loadPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`film-inv:${key}`)
    if (raw != null) return JSON.parse(raw)
  } catch { /* ignore */ }
  return fallback
}

function savePref<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`film-inv:${key}`, JSON.stringify(value))
  } catch { /* ignore */ }
}

// ── Dark mode ──

export type ThemeMode = 'system' | 'light' | 'dark'

function getSystemDark(): boolean {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
}

export const themeMode = signal<ThemeMode>(loadPref('themeMode', 'system'))

// Counter that increments when system preference changes, forcing isDark to re-evaluate
const systemChangeTick = signal(0)

export const isDark = computed<boolean>(() => {
  // Read tick to force recomputation on system change
  void systemChangeTick.value
  if (themeMode.value === 'dark') return true
  if (themeMode.value === 'light') return false
  return getSystemDark()
})

// Apply dark class to <html> reactively
isDark.subscribe((dark) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', dark)
  }
})

// Listen for system changes when in 'system' mode
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    systemChangeTick.value++
  })
}

export function setThemeMode(mode: ThemeMode): void {
  themeMode.value = mode
  savePref('themeMode', mode)
}

export function toggleDarkMode(): void {
  if (isDark.value) {
    setThemeMode('light')
  } else {
    setThemeMode('dark')
  }
}

// ── Active tab ──

export type Tab = 'inventory' | 'cameras' | 'log' | 'settings' | 'stock-detail' | 'camera-detail'

export const activeTab = signal<Tab>('inventory')
export const activeStockId = signal<string | null>(null) // for stock detail drill-down
export const selectedCameraId = signal<string | null>(null) // for camera detail drill-down

// ── Expanded stock groups (inventory list) ──

export const expandedStockIds = signal<Set<string>>(new Set())

export function toggleStockExpanded(stockId: string): void {
  const next = new Set(expandedStockIds.value)
  if (next.has(stockId)) {
    next.delete(stockId)
  } else {
    next.add(stockId)
  }
  expandedStockIds.value = next
}

export function expandAll(stockIds: string[]): void {
  expandedStockIds.value = new Set(stockIds)
}

// ── Filter state ──

export interface FilterState {
  type: FilmType | null
  iso: number | null
  brand: string | null
  format: FilmFormat | null
  location: Location | null
  search: string
}

const defaultFilter: FilterState = {
  type: null,
  iso: null,
  brand: null,
  format: null,
  location: null,
  search: '',
}

export const filterState = signal<FilterState>({ ...defaultFilter })

export const activeFilterCount = computed<number>(() => {
  let count = 0
  const f = filterState.value
  if (f.type) count++
  if (f.iso) count++
  if (f.brand) count++
  if (f.format) count++
  if (f.location) count++
  if (f.search.trim()) count++
  return count
})

export function setFilter(patch: Partial<FilterState>): void {
  filterState.value = { ...filterState.value, ...patch }
}

export function clearFilters(): void {
  filterState.value = { ...defaultFilter }
}
