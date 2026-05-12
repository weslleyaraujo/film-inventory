import { signal } from '@preact/signals'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { SegmentedControl } from '../ui/SegmentedControl'
import { Stepper } from '../ui/Stepper'
import { addStock } from '../../store/stocks'
import { addVariant } from '../../store/variants'
import { addInventoryItem } from '../../store/inventory'
import { stocks } from '../../store/stocks'
import type { FilmType, FilmFormat, Location } from '../../db/types'
import { confirmTap } from '../../lib/haptics'

interface AddFilmSheetProps {
  open: boolean
  onClose: () => void
}

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

const LOCATIONS: { value: Location; label: string }[] = [
  { value: 'with-me', label: 'With me' },
  { value: 'fridge', label: 'Stored' },
]

// Form state signals
const stockName = signal('')
const isNewStock = signal(false)
const brand = signal('')
const type = signal<FilmType>('color-negative')
const iso = signal(400)
const variantName = signal('')
const format = signal<FilmFormat>('35mm')
const quantity = signal(1)
const location = signal<Location>('with-me')
const dxCoded = signal(false)
const notes = signal('')
const submitting = signal(false)

function resetForm() {
  stockName.value = ''
  isNewStock.value = false
  brand.value = ''
  type.value = 'color-negative'
  iso.value = 400
  variantName.value = ''
  format.value = '35mm'
  quantity.value = 1
  location.value = 'with-me'
  dxCoded.value = false
  notes.value = ''
  submitting.value = false
}

export function AddFilmSheet({ open, onClose }: AddFilmSheetProps) {
  const handleSubmit = async () => {
    if (!stockName.value.trim()) return
    submitting.value = true

    try {
      // Find or create stock
      let stockId: string
      const existing = stocks.value.find(
        (s) =>
          s.name.toLowerCase() === stockName.value.trim().toLowerCase() &&
          s.type === type.value &&
          s.iso === iso.value
      )

      if (existing) {
        stockId = existing.id
      } else {
        stockId = await addStock({
          name: stockName.value.trim(),
          brand: brand.value.trim(),
          type: type.value,
          iso: iso.value,
        })
      }

      // Create variant
      const vid = await addVariant({
        stockId,
        name: variantName.value.trim() || stockName.value.trim(),
        format: format.value,
        dxCoded: dxCoded.value,
        notes: notes.value.trim() || undefined,
      })

      // Add to inventory
      await addInventoryItem({
        variantId: vid,
        quantity: quantity.value,
        location: location.value,

      })

      confirmTap()
      resetForm()
      onClose()
    } catch (err) {
      console.error('Failed to add film:', err)
    } finally {
      submitting.value = false
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Film" variant="sheet">
      <div class="flex flex-col gap-4">
        {/* Stock name — autocomplete from existing */}
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Stock</label>
          <input
            type="text"
            value={stockName}
            onInput={(e) => {
              stockName.value = (e.target as HTMLInputElement).value
              // Check if matching existing stock
              const match = stocks.value.find(
                (s) => s.name.toLowerCase() === stockName.value.trim().toLowerCase()
              )
              isNewStock.value = !match && stockName.value.trim().length > 0
            }}
            placeholder="e.g. Kodak Portra 400"
            class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)]
                   rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                   focus:outline-none focus:border-[var(--color-accent)]"
          />
          {/* Existing stock suggestions */}
          {stockName.value.trim() && !isNewStock.value && (
            <div class="flex flex-col gap-1">
              {stocks.value
                .filter((s) =>
                  s.name.toLowerCase().includes(stockName.value.trim().toLowerCase())
                )
                .slice(0, 3)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      stockName.value = s.name
                      brand.value = s.brand
                      type.value = s.type
                      iso.value = s.iso
                      isNewStock.value = false
                    }}
                    class="text-left px-3 py-2 rounded-lg text-caption text-[var(--text-secondary)]
                           bg-[var(--bg-card)] hover:bg-[var(--bg-app)]"
                  >
                    {s.name} · {s.brand} · ISO {s.iso}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* New stock fields — only show when creating a new stock */}
        {isNewStock.value && (
          <div class="flex flex-col gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)]">
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Brand</label>
              <input
                type="text"
                value={brand}
                onInput={(e) => (brand.value = (e.target as HTMLInputElement).value)}
                placeholder="e.g. Kodak"
                class="w-full px-4 py-2.5 bg-[var(--bg-app)] border border-[var(--color-border)]
                       rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                       focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Type</label>
              <SegmentedControl options={FILM_TYPES} value={type.value} onChange={(v) => (type.value = v)} />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">ISO</label>
              <Stepper value={iso.value} onChange={(v) => (iso.value = v)} min={25} max={6400} />
            </div>
          </div>
        )}

        {/* Variant name */}
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Variant name (optional)</label>
          <input
            type="text"
            value={variantName}
            onInput={(e) => (variantName.value = (e.target as HTMLInputElement).value)}
            placeholder="e.g. Dubblelab respool"
            class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)]
                   rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                   focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {/* Format + DX Coded row */}
        <div class="flex items-end gap-4">
          <div class="flex flex-col gap-1.5 items-start">
            <label class="text-caption text-[var(--text-secondary)]">Format</label>
            <SegmentedControl options={FORMATS} value={format.value} onChange={(v) => (format.value = v)} />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-caption text-[var(--text-secondary)]">DX Coded</label>
            <label class="flex items-center gap-3 py-1 cursor-pointer">
              <div
                class={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
                  ${dxCoded.value
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                    : 'border-[var(--color-border)] bg-[var(--bg-card)]'
                  }`}
                onClick={() => (dxCoded.value = !dxCoded.value)}
              >
                {dxCoded.value && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span class="text-body text-[var(--text-secondary)]">DX Coded</span>
            </label>
          </div>
        </div>

        {/* Quantity + Location row */}
        <div class="flex items-center gap-4">
          <div class="flex flex-col gap-1.5 flex-1">
            <label class="text-caption text-[var(--text-secondary)]">Quantity</label>
            <Stepper value={quantity.value} onChange={(v) => (quantity.value = v)} min={1} max={100} />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-caption text-[var(--text-secondary)]">Location</label>
            <SegmentedControl options={LOCATIONS} value={location.value} onChange={(v) => (location.value = v)} />
          </div>
        </div>

        {/* Notes */}
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Notes (optional)</label>
          <textarea
            value={notes}
            onInput={(e) => (notes.value = (e.target as HTMLTextAreaElement).value)}
            placeholder="e.g. non-DX, respooled"
            rows={2}
            class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)]
                   rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                   focus:outline-none focus:border-[var(--color-accent)] resize-none"
          />
        </div>

        {/* Submit */}
        <Button
          fullWidth
          disabled={submitting.value || !stockName.value.trim()}
          onClick={handleSubmit}
        >
          {submitting.value ? 'Adding…' : 'Add to Inventory'}
        </Button>
      </div>
    </Modal>
  )
}
