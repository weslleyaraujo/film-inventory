import { signal, computed } from '@preact/signals'
import { Search, X } from 'lucide-preact'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { TypeDot } from '../ui/Badge'
import { inventoryWithDetails } from '../../store/inventory'
import { loadFilm } from '../../store/cameras'
import type { FilmFormat, FilmType } from '../../db/types'
import { confirmTap } from '../../lib/haptics'

interface LoadFilmModalProps {
  open: boolean
  onClose: () => void
  cameraId: string
  cameraFormats: FilmFormat[]
  cameraName: string
}

/** Deduplicated entry: groups inventory items by variantId, aggregates quantities */
interface VariantOption {
  variantId: string
  name: string
  format: FilmFormat
  stockName: string
  stockType: FilmType
  totalQuantity: number
  withMeQty: number
  fridgeQty: number
  /** Display string for locations (e.g. "with-me" or "fridge" or "with-me, fridge") */
  locationLabel: string
}

const FRAME_COUNTS_35MM = [24, 36]
const FRAME_COUNTS_120 = [8, 10, 12, 16]
const FRAME_COUNTS_220 = [16, 20, 24, 32]

function defaultFrameCount(format: FilmFormat): number {
  switch (format) {
    case '35mm': return 36
    case '120': return 12
    case '220': return 24
  }
}

const selectedVariantId = signal<string | null>(null)
const frameCount = signal(36)
const loadNotes = signal('')
const decrement = signal(true)
const submitting = signal(false)
const searchQuery = signal('')

function resetForm() {
  selectedVariantId.value = null
  frameCount.value = 36
  loadNotes.value = ''
  decrement.value = true
  submitting.value = false
  searchQuery.value = ''
}

export function LoadFilmModal({
  open,
  onClose,
  cameraId,
  cameraFormats,
  cameraName,
}: LoadFilmModalProps) {
  /** Deduplicated variant options sorted with-me first */
  const matchingVariants = computed<VariantOption[]>(() => {
    // 1. Filter raw inventory items
    const filtered = inventoryWithDetails.value.filter((item) => {
      if (!cameraFormats.includes(item.variant.format)) return false
      if (item.quantity <= 0) return false
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        const haystack = [item.variant.name, item.variant.stock.name, item.variant.stock.brand, item.variant.format].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    // 2. Group by variantId, aggregate quantities
    const grouped = new Map<string, {
      name: string
      format: FilmFormat
      stockName: string
      stockType: FilmType
      totalQuantity: number
      withMeQty: number
      fridgeQty: number
    }>()

    for (const item of filtered) {
      const vid = item.variant.id
      const existing = grouped.get(vid)
      if (existing) {
        existing.totalQuantity += item.quantity
        if (item.location === 'with-me') existing.withMeQty += item.quantity
        else existing.fridgeQty += item.quantity
      } else {
        grouped.set(vid, {
          name: item.variant.name,
          format: item.variant.format,
          stockName: item.variant.stock.name,
          stockType: item.variant.stock.type,
          totalQuantity: item.quantity,
          withMeQty: item.location === 'with-me' ? item.quantity : 0,
          fridgeQty: item.location === 'fridge' ? item.quantity : 0,
        })
      }
    }

    // 3. Sort: with-me first, then fridge-only
    const entries = Array.from(grouped.entries()).map(([vid, data]) => {
      const locationParts: string[] = []
      if (data.withMeQty > 0) locationParts.push('with-me')
      if (data.fridgeQty > 0) locationParts.push('fridge')
      return {
        variantId: vid,
        name: data.name,
        format: data.format,
        stockName: data.stockName,
        stockType: data.stockType,
        totalQuantity: data.totalQuantity,
        withMeQty: data.withMeQty,
        fridgeQty: data.fridgeQty,
        locationLabel: locationParts.join(', '),
      } satisfies VariantOption
    })

    entries.sort((a, b) => {
      const aWithMe = a.withMeQty > 0 ? 0 : 1
      const bWithMe = b.withMeQty > 0 ? 0 : 1
      if (aWithMe !== bWithMe) return aWithMe - bWithMe
      // Within same group, sort by name
      return a.name.localeCompare(b.name)
    })

    return entries
  })

  /** The selected variant option (for format-aware frame count) */
  const selectedOption = computed<VariantOption | undefined>(() =>
    selectedVariantId.value
      ? matchingVariants.value.find((v) => v.variantId === selectedVariantId.value)
      : undefined
  )

  /** Frame count presets for the currently selected variant's format */
  const frameCountPresets = computed<number[]>(() => {
    const fmt = selectedOption.value?.format
    if (fmt === '120') return FRAME_COUNTS_120
    if (fmt === '220') return FRAME_COUNTS_220
    return FRAME_COUNTS_35MM
  })

  const selectVariant = (variantId: string) => {
    const prev = selectedVariantId.value
    selectedVariantId.value = variantId
    // Reset frame count to default when switching to a different-format variant
    if (variantId !== prev) {
      const opt = matchingVariants.value.find((v) => v.variantId === variantId)
      if (opt) {
        frameCount.value = defaultFrameCount(opt.format)
      }
    }
  }

  const handleSubmit = async () => {
    if (!selectedVariantId.value || !cameraId) return
    submitting.value = true
    try {
      await loadFilm(cameraId, selectedVariantId.value, {
        frameCount: frameCount.value > 0 ? frameCount.value : undefined,
        notes: loadNotes.value.trim() || undefined,
        decrementInventory: decrement.value,
      })
      confirmTap()
      resetForm()
      onClose()
    } catch (err) {
      console.error('Failed to load film:', err)
    } finally {
      submitting.value = false
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Load Film — ${cameraName}`} variant="sheet">
      <div class="flex flex-col gap-4">
        <p class="text-caption text-[var(--text-tertiary)]">
          Format{cameraFormats.length > 1 ? 's' : ''}: {cameraFormats.join(', ')}
        </p>

        {/* Search */}
        <div class="relative">
          <Search size={14} strokeWidth={1.5} class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
          <input type="text" value={searchQuery} onInput={(e) => (searchQuery.value = (e.target as HTMLInputElement).value)}
            placeholder="Search variants…"
            class="w-full pl-9 pr-8 py-2.5 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--color-accent)]" />
          {searchQuery.value && (
            <button onClick={() => (searchQuery.value = '')} class="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Variant list */}
        <div class="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {matchingVariants.value.length === 0 ? (
            <p class="text-caption text-[var(--text-tertiary)] py-4 text-center">
              No matching films in inventory
            </p>
          ) : (
            (() => {
              const rows: any[] = []
              let shownFridgeHeader = false
              for (const opt of matchingVariants.value) {
                if (opt.withMeQty === 0 && !shownFridgeHeader) {
                  shownFridgeHeader = true
                  rows.push(
                    <p key="stored-header" class="text-brand text-[var(--text-tertiary)] px-4 pt-3 pb-1">Stored</p>
                  )
                }
                rows.push(
                  <button
                    key={opt.variantId}
                    onClick={() => selectVariant(opt.variantId)}
                    class={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left
                      ${selectedVariantId.value === opt.variantId
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                        : 'border-[var(--color-border)] bg-[var(--bg-card)] hover:bg-[var(--bg-app)]'
                      }`}
                  >
                    <TypeDot type={opt.stockType} />
                    <div class="flex-1 min-w-0">
                      <p class="text-body truncate">{opt.name}</p>
                      <p class="text-caption text-[var(--text-secondary)]">
                        {opt.stockName} · {opt.format} · {opt.totalQuantity} {opt.totalQuantity === 1 ? 'roll' : 'rolls'} ({opt.locationLabel})
                      </p>
                    </div>
                  </button>
                )
              }
              return rows
            })()
          )}
        </div>

        {selectedVariantId.value && (
          <>
            {/* Frame count */}
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Frame count</label>
              <div class="flex gap-2 flex-wrap">
                {frameCountPresets.value.map((n) => (
                  <button
                    key={n}
                    onClick={() => (frameCount.value = n)}
                    class={`px-4 py-2 rounded-xl text-caption font-medium border
                      ${frameCount.value === n
                        ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--color-border)]'
                      }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => (frameCount.value = 0)}
                  class={`px-4 py-2 rounded-xl text-caption font-medium border
                    ${frameCount.value === 0
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--color-border)]'
                    }`}
                >
                  None
                </button>
              </div>
            </div>

            {/* Notes */}
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Notes (optional)</label>
              <input
                type="text"
                value={loadNotes}
                onInput={(e) => (loadNotes.value = (e.target as HTMLInputElement).value)}
                placeholder="e.g. pushing +1"
                class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)]
                       rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                       focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Decrement toggle */}
            <label class="flex items-center gap-3 py-1">
              <input
                type="checkbox"
                checked={decrement}
                onChange={(e) => (decrement.value = (e.target as HTMLInputElement).checked)}
                class="w-5 h-5 rounded accent-[var(--color-accent)]"
              />
              <span class="text-body text-[var(--text-secondary)]">Remove from inventory</span>
            </label>
          </>
        )}

        <Button
          fullWidth
          disabled={submitting.value || !selectedVariantId.value}
          onClick={handleSubmit}
        >
          {submitting.value ? 'Loading…' : `Load in ${cameraName}`}
        </Button>
      </div>
    </Modal>
  )
}
