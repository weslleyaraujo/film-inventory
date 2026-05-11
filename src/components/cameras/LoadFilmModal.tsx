import { signal, computed } from '@preact/signals'
import { Search, X } from 'lucide-preact'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { TypeDot } from '../ui/Badge'
import { inventoryWithDetails } from '../../store/inventory'
import { loadFilm } from '../../store/cameras'
import type { FilmFormat } from '../../db/types'

interface LoadFilmModalProps {
  open: boolean
  onClose: () => void
  cameraId: string
  cameraFormats: FilmFormat[]
  cameraName: string
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
  const matchingVariants = computed(() =>
    inventoryWithDetails.value.filter((item) => {
      if (!cameraFormats.includes(item.variant.format)) return false
      if (item.quantity <= 0) return false
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        const haystack = [item.variant.name, item.variant.stock.name, item.variant.stock.brand, item.variant.format].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  )

  const handleSubmit = async () => {
    if (!selectedVariantId.value || !cameraId) return
    submitting.value = true
    try {
      await loadFilm(cameraId, selectedVariantId.value, {
        frameCount: frameCount.value > 0 ? frameCount.value : undefined,
        notes: loadNotes.value.trim() || undefined,
        decrementInventory: decrement.value,
      })
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
            matchingVariants.value.map((item) => (
              <button
                key={item.id}
                onClick={() => (selectedVariantId.value = item.variant.id)}
                class={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left
                  ${selectedVariantId.value === item.variant.id
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                    : 'border-[var(--color-border)] bg-[var(--bg-card)] hover:bg-[var(--bg-app)]'
                  }`}
              >
                <TypeDot type={item.variant.stock.type} />
                <div class="flex-1 min-w-0">
                  <p class="text-body truncate">{item.variant.name}</p>
                  <p class="text-caption text-[var(--text-secondary)]">
                    {item.variant.stock.name} · {item.variant.format} · {item.quantity} rolls ({item.location})
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {selectedVariantId.value && (
          <>
            {/* Frame count */}
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Frame count</label>
              <div class="flex gap-2">
                {[24, 36].map((n) => (
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
