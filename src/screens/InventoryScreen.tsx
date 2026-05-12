import { computed, signal } from '@preact/signals'
import { motion, AnimatePresence } from 'motion/react'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Film, Plus, ThermometerSnowflake, ArrowUpRight, BarChart3, X, Trash2 } from 'lucide-preact'
import {
  filteredInventory,
  filteredTotalRolls,
  filteredTotal35mm,
  filteredTotal120,
  totalWithMe,
  totalFridge,
  inventoryWithDetails,
} from '../store/inventory'
import { stocks, updateStock, deleteStock } from '../store/stocks'
import { updateVariant, deleteVariant } from '../store/variants'
import { expandedStockIds, toggleStockExpanded, activeTab, activeStockId, filterState, setFilter, clearFilters } from '../store/ui'
import { AddFilmSheet } from '../components/inventory/AddFilmSheet'
import { AnalyticsModal } from './AnalyticsModal'
import { Stepper } from '../components/ui/Stepper'
import { Modal } from '../components/ui/Modal'
import type { FilmType, FilmFormat } from '../db/types'
import type { ComponentChildren } from 'preact'

const showAddSheet = signal(false)
const showAnalytics = signal(false)
// ── Edit sheet form state (module-level, survives re-renders) ──
const editingVariantId = signal<string | null>(null)
const editVariantName = signal('')
const editVariantNotes = signal('')

const editingStockId = signal<string | null>(null)
const editStockName = signal('')
const editStockBrand = signal('')
const editStockType = signal<FilmType>('color-negative')
const editStockIso = signal(400)
const editStockNotes = signal('')
const savingVariant = signal(false)
const savingStock = signal(false)

const FILM_TYPES: { value: FilmType; label: string }[] = [
  { value: 'color-negative', label: 'Color Neg' },
  { value: 'color-positive', label: 'Color Pos' },
  { value: 'bw', label: 'B&W' },
]

const FORMATS: { value: FilmFormat; label: string }[] = [
  { value: '35mm', label: '35mm' },
  { value: '120', label: '120' },
  { value: '220', label: '220' },
]

const COMMON_ISO = [50, 100, 200, 250, 400, 500, 800]

/** Grouped per-variant data for the home page display */
interface VariantGroup {
  variantId: string
  name: string
  format: FilmFormat
  stockId: string
  stockName: string
  stockBrand: string
  stockType: FilmType
  total: number
  carried: number
}

export function InventoryScreen() {
  // Group filtered inventory by stock, then by variant within each stock
  const grouped = computed(() => {
    const stockMap = new Map<string, {
      stock: (typeof stocks.value)[number]
      variantMap: Map<string, { name: string; format: FilmFormat; carried: number; fridge: number }>
    }>()

    for (const item of filteredInventory.value) {
      const stockId = item.variant.stockId
      const stock = stocks.value.find((s) => s.id === stockId)
      if (!stock) continue

      let entry = stockMap.get(stockId)
      if (!entry) {
        entry = { stock, variantMap: new Map() }
        stockMap.set(stockId, entry)
      }

      const vid = item.variant.id
      let v = entry.variantMap.get(vid)
      if (!v) {
        v = { name: item.variant.name, format: item.variant.format, carried: 0, fridge: 0 }
        entry.variantMap.set(vid, v)
      }
      if (item.location === 'with-me') v.carried += item.quantity
      else v.fridge += item.quantity
    }

    // Flatten to array sorted by brand then name
    const result: { stock: (typeof stocks.value)[number]; variants: VariantGroup[] }[] = []
    for (const [, entry] of stockMap) {
      const vars: VariantGroup[] = []
      for (const [vid, v] of entry.variantMap) {
        vars.push({
          variantId: vid,
          name: v.name,
          format: v.format,
          stockId: entry.stock.id,
          stockName: entry.stock.name,
          stockBrand: entry.stock.brand,
          stockType: entry.stock.type,
          total: v.carried + v.fridge,
          carried: v.carried,
        })
      }
      vars.sort((a, b) => a.name.localeCompare(b.name))
      result.push({ stock: entry.stock, variants: vars })
    }
    result.sort((a, b) => {
      const brandCmp = a.stock.brand.localeCompare(b.stock.brand)
      if (brandCmp !== 0) return brandCmp
      return a.stock.name.localeCompare(b.stock.name)
    })
    return result
  })

  const activeCount = computed(() => {
    let c = 0
    const f = filterState.value
    if (f.type) c++
    if (f.iso) c++
    if (f.format) c++
    if (f.location) c++
    if (f.search.trim()) c++
    return c
  })

  const hasAnyInventory = computed(() => inventoryWithDetails.value.length > 0)

  return (
    <div class="flex flex-col min-h-full">
      {/* Header */}
      <header class="px-5 pt-[calc(16px+var(--safe-top))] pb-4 flex items-center justify-between">
        <h1 class="text-screen-title">Inventory</h1>
        <button
          onClick={() => (showAnalytics.value = true)}
          class="p-2 -mr-2 rounded-xl text-[var(--text-tertiary)] hover:bg-[var(--bg-card)]"
          aria-label="Analytics"
        >
          <BarChart3 size={20} strokeWidth={1.5} />
        </button>
      </header>

      {/* Stats bar — tappable cards for format filters */}
      <section class="px-5 pb-3 flex gap-3">
        <div class="flex-1 bg-[var(--bg-card)] rounded-2xl p-4 text-center border border-[var(--color-border)]">
          <p class="text-hero text-[var(--text-primary)]"><AnimatedNumber value={filteredTotalRolls.value} /></p>
          <p class="text-caption text-[var(--text-tertiary)]">Total</p>
        </div>
        <button
          onClick={() => setFilter({ format: filterState.value.format === '35mm' ? null : '35mm' })}
          class={`flex-1 bg-[var(--bg-card)] rounded-2xl p-4 text-center border transition-colors
            ${filterState.value.format === '35mm'
              ? 'border-[var(--color-accent)]'
              : 'border-[var(--color-border)] hover:border-[var(--text-tertiary)]'}`}
        >
          <p class="text-hero text-[var(--text-primary)]"><AnimatedNumber value={filteredTotal35mm.value} /></p>
          <p class="text-caption text-[var(--text-tertiary)]">35mm</p>
        </button>
        <button
          onClick={() => setFilter({ format: filterState.value.format === '120' ? null : '120' })}
          class={`flex-1 bg-[var(--bg-card)] rounded-2xl p-4 text-center border transition-colors
            ${filterState.value.format === '120'
              ? 'border-[var(--color-accent)]'
              : 'border-[var(--color-border)] hover:border-[var(--text-tertiary)]'}`}
        >
          <p class="text-hero text-[var(--text-primary)]"><AnimatedNumber value={filteredTotal120.value} /></p>
          <p class="text-caption text-[var(--text-tertiary)]">120</p>
        </button>
      </section>

      {/* Search */}
      <section class="px-5 pb-2">
        <SearchInput />
      </section>

      {/* Filter chips — horizontal scroll bleeding to edges */}
      <div class="relative pb-3">
        <div class="flex gap-1.5 overflow-x-auto px-5 scrollbar-none mask-r">
          <FilterChip
            label={<span class="flex items-center gap-1"><ArrowUpRight size={12} />{totalWithMe} with me</span>}
            active={filterState.value.location === 'with-me'}
            onClick={() => setFilter({ location: filterState.value.location === 'with-me' ? null : 'with-me' })}
          />
          <FilterChip
            label={<span class="flex items-center gap-1"><ThermometerSnowflake size={12} />{totalFridge} stored</span>}
            active={filterState.value.location === 'fridge'}
            onClick={() => setFilter({ location: filterState.value.location === 'fridge' ? null : 'fridge' })}
          />
          <span class="w-px h-5 bg-[var(--color-separator)] self-center mx-0.5 flex-shrink-0" />
          {FILM_TYPES.map((t) => (
            <FilterChip key={t.value} label={t.label} active={filterState.value.type === t.value}
              onClick={() => setFilter({ type: filterState.value.type === t.value ? null : t.value })} />
          ))}
          <span class="w-px h-5 bg-[var(--color-separator)] self-center mx-0.5 flex-shrink-0" />
          {FORMATS.map((f) => (
            <FilterChip key={f.value} label={f.label} active={filterState.value.format === f.value}
              onClick={() => setFilter({ format: filterState.value.format === f.value ? null : f.value })} />
          ))}
          <span class="w-px h-5 bg-[var(--color-separator)] self-center mx-0.5 flex-shrink-0" />

          {COMMON_ISO.map((iso) => (
            <FilterChip key={iso} label={`ISO ${iso}`} active={filterState.value.iso === iso}
              onClick={() => setFilter({ iso: filterState.value.iso === iso ? null : iso })} />
          ))}
        </div>
        <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--bg-app)] to-transparent pointer-events-none" />
        {activeCount.value > 0 && (
          <div class="px-5 mt-2 flex items-center gap-2">
            <span class="text-caption text-[var(--color-accent)]">{activeCount} filter{activeCount.value !== 1 ? 's' : ''}</span>
            <button onClick={clearFilters} class="text-caption text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1">
              <X size={12} strokeWidth={2} />Clear
            </button>
          </div>
        )}
      </div>

      {/* Film list */}
      <section class="px-5 pb-4 flex flex-col">
        {grouped.value.length === 0 ? (
          hasAnyInventory.value ? (
            <FilteredEmptyState />
          ) : (
            <EmptyState />
          )
        ) : (
          grouped.value.map((group, idx) => {
            const prevBrand = idx > 0 ? grouped.value[idx - 1].stock.brand : ''
            const showBrand = group.stock.brand !== prevBrand
            return (
              <div key={group.stock.id}>
                {showBrand && (
                  <h2 class="text-brand text-[var(--text-tertiary)] px-1 pt-4 pb-2">{group.stock.brand}</h2>
                )}
                <StockGroupCard stock={group.stock} variants={group.variants} />
              </div>
            )
          })
        )}
      </section>

      {/* FAB */}
      <button
        onClick={() => (showAddSheet.value = true)}
        class="fixed right-5 w-14 h-14 rounded-2xl bg-[var(--color-accent)] text-white shadow-lg flex items-center justify-center z-10 active:scale-95 transition-transform bottom-[68px]"
        aria-label="Add film"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Modals */}
      <AddFilmSheet open={showAddSheet.value} onClose={() => (showAddSheet.value = false)} />
      <AnalyticsModal open={showAnalytics.value} onClose={() => (showAnalytics.value = false)} />
      <EditVariantSheet />
      <EditStockSheet />
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: ComponentChildren; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      class={`shrink-0 px-3 py-1.5 rounded-full text-caption font-medium transition-colors border
        ${active
          ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--color-border)] hover:border-[var(--text-tertiary)]'
        }`}
    >{label}</button>
  )
}

function EmptyState() {
  return (
    <div class="flex flex-col items-center justify-center py-20 gap-4 text-[var(--text-tertiary)]">
      <Film size={56} strokeWidth={1} />
      <p class="text-body">No film in inventory yet</p>
      <p class="text-caption">Tap + to add film or import a JSON backup from Settings</p>
    </div>
  )
}

function FilteredEmptyState() {
  return (
    <div class="flex flex-col items-center justify-center py-20 gap-4 text-[var(--text-tertiary)]">
      <Film size={56} strokeWidth={1} />
      <p class="text-body">No results</p>
      <p class="text-caption">Try adjusting your filters or search</p>
    </div>
  )
}

function StockGroupCard({ stock, variants }: { stock: (typeof stocks.value)[number]; variants: VariantGroup[] }) {
  const isExpanded = computed(() => expandedStockIds.value.has(stock.id))
  const typeDotColor = stock.type === 'color-negative' ? 'var(--color-negative)' : stock.type === 'color-positive' ? 'var(--color-positive)' : 'var(--color-bw)'
  const totalForStock = variants.reduce((sum, v) => sum + v.total, 0)
  const carriedForStock = variants.reduce((sum, v) => sum + v.carried, 0)
  const hasSingleVariant = variants.length === 1

  return (
    <div class="bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--color-border)] mb-2">
      {/* Single variant: one compact row, no header */}
      {hasSingleVariant ? (
        <SingleVariantRow variant={variants[0]} stock={stock} typeDotColor={typeDotColor} />
      ) : (
        <>
          <div class="flex items-center">
            <button
              onClick={() => toggleStockExpanded(stock.id)}
              class="flex-1 flex items-center gap-3 px-4 py-3 text-left min-w-0">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style={`background: ${typeDotColor}`} />
              <div class="flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); activeStockId.value = stock.id; activeTab.value = 'stock-detail' }}>
                <p class="text-body truncate hover:underline">{stock.name}</p>
                <p class="text-caption text-[var(--text-secondary)]">ISO {stock.iso}</p>
              </div>
              <span class="text-mono flex items-center gap-0.5 flex-shrink-0">
                {carriedForStock > 0 ? (
                  <>
                    <span class="text-[var(--color-accent)]">{carriedForStock}</span>
                    <span class="text-[var(--text-tertiary)]">/</span>
                  </>
                ) : null}
                <span class="text-[var(--text-secondary)]">{totalForStock}</span>
              </span>
              <span class="text-[var(--text-tertiary)] text-sm">{isExpanded.value ? '▾' : '▸'}</span>
            </button>
          </div>

          {/* Multiple variants: expand/collapse */}
          {isExpanded.value && (
            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                class="border-t border-[var(--color-separator)] overflow-hidden"
              >
                {variants.map((v) => (
                  <VariantRow key={v.variantId} variant={v} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  )
}

function VariantRow({ variant }: { variant: VariantGroup }) {
  const handleTap = () => {
    activeStockId.value = variant.stockId
    activeTab.value = 'stock-detail'
  }

  return (
    <button
      onClick={handleTap}
      class="w-full flex items-center gap-2 px-4 py-2.5 border-b border-[var(--color-separator)] last:border-b-0 text-left
             hover:bg-[var(--bg-elevated)] active:bg-[var(--color-accent-muted)] transition-colors"
    >
      <div class="flex-1 min-w-0">
        <p class="text-body truncate">{variant.name}</p>
        <div class="flex items-center gap-2 mt-0.5">
          <span class="text-caption px-1.5 py-0 rounded-md bg-[var(--color-accent-muted)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
            {variant.format}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-1 text-mono flex-shrink-0">
        {variant.carried > 0 ? (
          <>
            <span class="text-[var(--color-accent)]">{variant.carried}</span>
            <span class="text-[var(--text-tertiary)]">/</span>
          </>
        ) : null}
        <span class="text-[var(--text-secondary)]">{variant.total}</span>
      </div>
    </button>
  )
}

/** Compact row for single-variant stocks — no header duplication */
function SingleVariantRow({ variant, stock, typeDotColor }: { variant: VariantGroup; stock: (typeof stocks.value)[number]; typeDotColor: string }) {
  const handleTap = () => {
    activeStockId.value = variant.stockId
    activeTab.value = 'stock-detail'
  }

  return (
    <button
      onClick={handleTap}
      class="w-full flex items-center gap-3 px-4 py-2.5 text-left
             hover:bg-[var(--bg-elevated)] active:bg-[var(--color-accent-muted)] transition-colors"
    >
      <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style={`background: ${typeDotColor}`} />
      <div class="flex-1 min-w-0">
        <p class="text-body truncate">{variant.name}</p>
        <p class="text-caption text-[var(--text-secondary)]">ISO {stock.iso} · <span class="inline">{variant.format}</span></p>
      </div>
      <div class="flex items-center gap-1 text-mono flex-shrink-0">
        {variant.carried > 0 ? (
          <>
            <span class="text-[var(--color-accent)]">{variant.carried}</span>
            <span class="text-[var(--text-tertiary)]">/</span>
          </>
        ) : null}
        <span class="text-[var(--text-secondary)]">{variant.total}</span>
      </div>
    </button>
  )
}

// ── Search Input ──

function SearchInput() {
  return (
    <div class="relative w-full">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <input
        type="text"
        value={filterState.value.search}
        onInput={(e) => setFilter({ search: (e.target as HTMLInputElement).value })}
        placeholder="Search…"
        class="w-full pl-9 pr-8 py-2 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-full text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] transition-[border-color]"
      />
      {filterState.value.search && (
        <button onClick={() => setFilter({ search: '' })} class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
          <X size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

// ── Edit Variant Sheet ──

function EditVariantSheet() {
  const vid = editingVariantId.value
  const item = vid ? inventoryWithDetails.value.find(i => i.id === vid) ?? null : null
  if (!item) return null

  // Lazy-init form on first render for this item
  if (editingVariantId.value !== vid || editVariantName.value === '') {
    editVariantName.value = item.variant.name
    editVariantNotes.value = item.variant.notes || ''
  }

  const handleSave = async () => {
    savingVariant.value = true
    try {
      await updateVariant(item.variant.id, { name: editVariantName.value.trim(), notes: editVariantNotes.value.trim() || undefined })
      editingVariantId.value = null
    } catch (err) { console.error(err) }
    finally { savingVariant.value = false }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.variant.name}"? This removes all inventory for this variant.`)) return
    await deleteVariant(item.variant.id)
    editingVariantId.value = null
  }

  const handleClose = () => { editingVariantId.value = null }

  return (
    <Modal open={true} onClose={handleClose} title="Edit Variant" variant="sheet">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Name</label>
          <input type="text" value={editVariantName.value} onInput={(e) => (editVariantName.value = (e.target as HTMLInputElement).value)}
            class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Format</label>
          <p class="text-body text-[var(--text-primary)]">{item.variant.format}</p>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Notes</label>
          <textarea value={editVariantNotes.value} onInput={(e) => (editVariantNotes.value = (e.target as HTMLTextAreaElement).value)} rows={2}
            class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] resize-none" />
        </div>
        <div class="flex gap-2">
          <button onClick={handleSave} disabled={savingVariant.value || !editVariantName.value.trim()}
            class="flex-1 px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white text-body font-semibold disabled:opacity-40">
            {savingVariant.value ? 'Saving…' : 'Save'}
          </button>
          <button onClick={handleDelete}
            class="px-5 py-3 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-body font-semibold">
            <Trash2 size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Edit Stock Sheet ──

function EditStockSheet() {
  const sid = editingStockId.value
  const stock = sid ? stocks.value.find(s => s.id === sid) : undefined
  if (!stock || !sid) return null

  // Lazy-init form on first render for this stock
  if (editingStockId.value !== sid || editStockName.value === '') {
    editStockName.value = stock.name
    editStockBrand.value = stock.brand
    editStockType.value = stock.type
    editStockIso.value = stock.iso
    editStockNotes.value = stock.notes || ''
  }

  const handleSave = async () => {
    savingStock.value = true
    try {
      await updateStock(sid, { name: editStockName.value.trim(), brand: editStockBrand.value.trim(), type: editStockType.value, iso: editStockIso.value, notes: editStockNotes.value.trim() || undefined })
      editingStockId.value = null
    } catch (err) { console.error(err) }
    finally { savingStock.value = false }
  }

  const handleDelete = async () => {
    try {
      await deleteStock(sid)
      editingStockId.value = null
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleClose = () => { editingStockId.value = null }

  return (
    <Modal open={true} onClose={handleClose} title="Edit Stock" variant="sheet">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Name</label>
          <input type="text" value={editStockName.value} onInput={(e) => (editStockName.value = (e.target as HTMLInputElement).value)}
            class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Brand</label>
          <input type="text" value={editStockBrand.value} onInput={(e) => (editStockBrand.value = (e.target as HTMLInputElement).value)}
            class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]" />
        </div>
        <div class="flex gap-3">
          <div class="flex-1 flex flex-col gap-1.5">
            <label class="text-caption text-[var(--text-secondary)]">Type</label>
            <div class="flex gap-1">
              {FILM_TYPES.map((t) => (
                <button key={t.value} onClick={() => (editStockType.value = t.value)}
                  class={`flex-1 px-2 py-2 rounded-lg text-caption font-medium border transition-colors
                    ${editStockType.value === t.value ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--color-border)]'}`}
                >{t.label}</button>
              ))}
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-caption text-[var(--text-secondary)]">ISO</label>
            <Stepper value={editStockIso.value} onChange={(v) => (editStockIso.value = v)} min={25} max={6400} />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Notes</label>
          <textarea value={editStockNotes.value} onInput={(e) => (editStockNotes.value = (e.target as HTMLTextAreaElement).value)} rows={2}
            class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] resize-none" />
        </div>
        <div class="flex gap-2">
          <button onClick={handleSave} disabled={savingStock.value || !editStockName.value.trim()}
            class="flex-1 px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white text-body font-semibold disabled:opacity-40">
            {savingStock.value ? 'Saving…' : 'Save'}
          </button>
          <button onClick={handleDelete}
            class="px-5 py-3 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-body font-semibold">
            <Trash2 size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </Modal>
  )
}
