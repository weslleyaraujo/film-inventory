import { computed, signal } from '@preact/signals'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { ArrowLeft, Camera, ClipboardList, ThermometerSnowflake, ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-preact'
import { stocks, updateStock, deleteStock } from '../store/stocks'
import { getVariantsByStock, addVariant, updateVariant, deleteVariant } from '../store/variants'
import {
  inventoryWithDetails,
  addInventoryItem,
  incrementQuantity,
  decrementQuantity,
  moveInventory,
} from '../store/inventory'
import { loadedFilmsWithDetails } from '../store/cameras'
import { finishedRollsWithDetails } from '../store/rolls'
import { activeTab, activeStockId } from '../store/ui'
import { TypeDot } from '../components/ui/Badge'
import { ISOBar } from '../components/ui/ISOBar'
import { Modal } from '../components/ui/Modal'
import { Stepper } from '../components/ui/Stepper'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import type { FilmStock, FilmType, FilmFormat, Location } from '../db/types'
import { formatRelative, formatDateFull } from '../lib/date'

// ── Sheet signals ──
const showEditStock = signal(false)
const editStockForm = { name: signal(''), brand: signal(''), type: signal<FilmType>('color-negative'), iso: signal(400), notes: signal('') }
const savingStockDetail = signal(false)

const showAddVariant = signal(false)
const newVariantName = signal('')
const newVariantFormat = signal<FilmFormat>('35mm')
const newVariantQty = signal(1)
const newVariantLocation = signal<Location>('with-me')
const newVariantNotes = signal('')
const newVariantDxCoded = signal(false)
const addingVariant = signal(false)

const editingVariantDetailId = signal<string | null>(null)
const editDetailVariantName = signal('')
const editDetailVariantNotes = signal('')
const editDetailVariantDxCoded = signal(false)
const savingDetailVariant = signal(false)

// ── Move-quantity state for detail page ──
const moveFromDetail = signal<{ variantId: string; variantName: string; variantFormat: FilmFormat; from: Location; to: Location; maxQty: number } | null>(null)
const moveDetailQty = signal(1)

const FORMAT_OPTIONS: { value: FilmFormat; label: string }[] = [
  { value: '35mm', label: '35mm' },
  { value: '120', label: '120' },
  { value: '220', label: '220' },
]

const LOC_OPTIONS: { value: Location; label: string }[] = [
  { value: 'with-me', label: 'With me' },
  { value: 'fridge', label: 'Stored' },
]

const FILM_TYPE_OPTIONS: { value: FilmType; label: string }[] = [
  { value: 'color-negative', label: 'Color Neg' },
  { value: 'color-positive', label: 'Color Pos' },
  { value: 'bw', label: 'B&W' },
]

export function StockDetailScreen() {
  const stock = computed<FilmStock | undefined>(() => {
    if (!activeStockId.value) return undefined
    return stocks.value.find((s) => s.id === activeStockId.value)
  })

  const variants = computed(() => {
    if (!activeStockId.value) return []
    return getVariantsByStock(activeStockId.value)
  })

  const invForStock = computed(() =>
    inventoryWithDetails.value.filter((i) => i.variant.stockId === activeStockId.value)
  )

  const totalRolls = computed(() => invForStock.value.reduce((s, i) => s + i.quantity, 0))
  const total35mm = computed(() =>
    invForStock.value.filter((i) => i.variant.format === '35mm').reduce((s, i) => s + i.quantity, 0)
  )
  const total120 = computed(() =>
    invForStock.value.filter((i) => i.variant.format === '120').reduce((s, i) => s + i.quantity, 0)
  )
  const withMe = computed(() =>
    invForStock.value.filter((i) => i.location === 'with-me').reduce((s, i) => s + i.quantity, 0)
  )
  const fridge = computed(() =>
    invForStock.value.filter((i) => i.location === 'fridge').reduce((s, i) => s + i.quantity, 0)
  )

  const camerasWithStock = computed(() =>
    loadedFilmsWithDetails.value.filter((lf) => lf.variant.stockId === activeStockId.value)
  )

  const finishedWithStock = computed(() =>
    finishedRollsWithDetails.value.filter((r) => r.variant.stockId === activeStockId.value)
  )

  if (!stock.value) {
    return (
      <div class="flex flex-col min-h-full px-5 pt-[calc(16px+var(--safe-top))]">
        <p class="text-body text-[var(--text-tertiary)]">Stock not found.</p>
      </div>
    )
  }

  const s = stock.value

  return (
    <div class="flex flex-col min-h-full pb-24">
      {/* Header */}
      <header class="flex items-center gap-3 px-5 pt-[calc(16px+var(--safe-top))] pb-4">
        <button
          onClick={() => (activeTab.value = 'inventory')}
          class="p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <h1 class="text-screen-title flex-1 truncate">{s.name}</h1>
        <button
          onClick={() => {
            editStockForm.name.value = s.name
            editStockForm.brand.value = s.brand
            editStockForm.type.value = s.type
            editStockForm.iso.value = s.iso
            editStockForm.notes.value = s.notes || ''
            showEditStock.value = true
          }}
          class="p-2 -mr-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
          aria-label="Edit stock"
        >
          <Pencil size={18} strokeWidth={1.5} />
        </button>
      </header>

      <section class="px-5 flex flex-col gap-4">
        {/* ISO bar + type dot */}
        <div class="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--color-border)]">
          <div class="flex items-center gap-3 mb-3">
            <TypeDot type={s.type} size="md" />
            <div>
              <p class="text-brand text-[var(--text-tertiary)]">{s.brand}</p>
            </div>
          </div>
          <ISOBar iso={s.iso} />
          <p class="text-caption text-[var(--text-tertiary)] mt-1 capitalize">{s.type.replace('-', ' ')}</p>
          {s.notes && <p class="text-caption text-[var(--text-secondary)] mt-2">{s.notes}</p>}
        </div>

        {/* Totals */}
        <div class="flex gap-3">
          <div class="flex-1 bg-[var(--bg-card)] rounded-2xl p-4 text-center border border-[var(--color-border)]">
            <p class="text-hero text-[var(--text-primary)]"><AnimatedNumber value={totalRolls.value} /></p>
            <p class="text-caption text-[var(--text-tertiary)]">Total</p>
          </div>
          <div class="flex-1 bg-[var(--bg-card)] rounded-2xl p-4 text-center border border-[var(--color-border)]">
            <p class="text-hero text-[var(--text-primary)]"><AnimatedNumber value={total35mm.value} /></p>
            <p class="text-caption text-[var(--text-tertiary)]">35mm</p>
          </div>
          <div class="flex-1 bg-[var(--bg-card)] rounded-2xl p-4 text-center border border-[var(--color-border)]">
            <p class="text-hero text-[var(--text-primary)]"><AnimatedNumber value={total120.value} /></p>
            <p class="text-caption text-[var(--text-tertiary)]">120</p>
          </div>
        </div>

        {/* Location pills */}
        <div class="flex gap-3">
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)]">
            <ArrowUpRight size={14} class="text-[var(--text-secondary)]" />
            <span class="text-caption text-[var(--text-secondary)]">{withMe} with me</span>
          </div>
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)]">
            <ThermometerSnowflake size={14} class="text-[var(--text-secondary)]" />
            <span class="text-caption text-[var(--text-secondary)]">{fridge} stored</span>
          </div>
        </div>

        {/* Variants */}
        <div class="bg-[var(--bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-separator)]">
            <p class="text-section-title">Variants</p>
            <button
              onClick={() => {
                newVariantName.value = ''
                newVariantFormat.value = '35mm'
                newVariantQty.value = 1
                newVariantLocation.value = 'with-me'
                newVariantNotes.value = ''
                newVariantDxCoded.value = false
                showAddVariant.value = true
              }}
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-caption font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] transition-colors"
            >
              <Plus size={14} strokeWidth={2} /> Add
            </button>
          </div>
          {variants.value.length === 0 && (
            <div class="px-4 py-6 text-center text-caption text-[var(--text-tertiary)]">
              No variants yet — tap Add to create one
            </div>
          )}
          {variants.value.map((v) => {
            const items = invForStock.value.filter(i => i.variantId === v.id)
            const carriedItem = items.find(i => i.location === 'with-me')
            const storedItem = items.find(i => i.location === 'fridge')
            const carried = carriedItem?.quantity ?? 0
            const stored = storedItem?.quantity ?? 0
            const total = carried + stored

            const doMove = async (from: 'with-me' | 'fridge', qty: number) => {
              const fromItem = from === 'with-me' ? carriedItem : storedItem
              const to = from === 'with-me' ? 'fridge' as const : 'with-me' as const
              if (!fromItem) return
              await moveInventory(fromItem.id, to, qty)
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
            }

            const handleStore = () => {
              if (carried === 1) {
                doMove('with-me', 1)
              } else {
                moveFromDetail.value = {
                  variantId: v.id,
                  variantName: v.name,
                  variantFormat: v.format,
                  from: 'with-me',
                  to: 'fridge',
                  maxQty: carried,
                }
                moveDetailQty.value = carried
              }
            }

            const handleTakeOut = () => {
              if (stored === 1) {
                doMove('fridge', 1)
              } else {
                moveFromDetail.value = {
                  variantId: v.id,
                  variantName: v.name,
                  variantFormat: v.format,
                  from: 'fridge',
                  to: 'with-me',
                  maxQty: stored,
                }
                moveDetailQty.value = stored
              }
            }

            return (
              <div
                key={v.id}
                class="border-b border-[var(--color-separator)] last:border-b-0"
              >
                {/* Row header: name, edit, total */}
                <div class="flex items-center gap-2 px-4 pt-3 pb-1">
                  <div class="flex-1 min-w-0 flex items-center gap-2">
                    <p class="text-body truncate">{v.name}</p>
                    <button
                      onClick={() => {
                        editingVariantDetailId.value = v.id
                        editDetailVariantName.value = v.name
                        editDetailVariantNotes.value = v.notes || ''
                        editDetailVariantDxCoded.value = v.dxCoded
                      }}
                      class="p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex-shrink-0"
                    >
                      <Pencil size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                  {total > 0 && (
                    <span class="text-mono text-[var(--text-secondary)] flex-shrink-0">{total} total</span>
                  )}
                </div>

                {/* Meta line: format, DX coded, notes */}
                <div class="flex items-center gap-2 px-4 pb-2">
                  <span class="text-caption px-2 py-0.5 rounded-md bg-[var(--color-accent-muted)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                    {v.format}
                  </span>
                  {v.dxCoded && (
                    <span class="text-caption px-1.5 py-0.5 rounded-md bg-[var(--color-accent-muted)] text-[var(--color-accent)] font-medium">
                      DX
                    </span>
                  )}
                  {v.notes && (
                    <span class="text-caption text-[var(--text-tertiary)] truncate">{v.notes}</span>
                  )}
                </div>

                {/* With me row */}
                <div class="flex items-center gap-2 px-4 pb-2">
                  <div class="flex items-center gap-1.5 flex-shrink-0 w-20">
                    <ArrowUpRight size={14} strokeWidth={2} class="text-[var(--text-secondary)]" />
                    <span class="text-caption text-[var(--text-secondary)]">With me</span>
                  </div>
                  {carried > 0 ? (
                    <>
                      <Stepper
                        value={carried}
                        onChange={async (val) => {
                          if (!carriedItem) return
                          if (val > carried) {
                            await incrementQuantity(carriedItem.id)
                          } else if (val < carried) {
                            if (val === 0) {
                              if (confirm(`Remove all "${v.name}" from with-me?`)) {
                                await decrementQuantity(carriedItem.id)
                              }
                            } else {
                              await decrementQuantity(carriedItem.id)
                            }
                          }
                          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(val > carried ? 10 : val === 0 ? [10, 50, 10] : 10)
                        }}
                      />
                      <button
                        onClick={handleStore}
                        class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-caption font-medium
                               bg-[var(--bg-app)] border border-[var(--color-border)] text-[var(--text-secondary)]
                               hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        <ThermometerSnowflake size={12} strokeWidth={2} />
                        <span>Store</span>
                      </button>
                    </>
                  ) : (
                    <span class="text-caption text-[var(--text-tertiary)]">—</span>
                  )}
                </div>

                {/* Stored row */}
                <div class="flex items-center gap-2 px-4 pb-3">
                  <div class="flex items-center gap-1.5 flex-shrink-0 w-20">
                    <ThermometerSnowflake size={14} strokeWidth={2} class="text-[var(--text-secondary)]" />
                    <span class="text-caption text-[var(--text-secondary)]">Stored</span>
                  </div>
                  {stored > 0 ? (
                    <>
                      <Stepper
                        value={stored}
                        onChange={async (val) => {
                          if (!storedItem) return
                          if (val > stored) {
                            await incrementQuantity(storedItem.id)
                          } else if (val < stored) {
                            if (val === 0) {
                              if (confirm(`Remove all "${v.name}" from storage?`)) {
                                await decrementQuantity(storedItem.id)
                              }
                            } else {
                              await decrementQuantity(storedItem.id)
                            }
                          }
                          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(val > stored ? 10 : val === 0 ? [10, 50, 10] : 10)
                        }}
                      />
                      <button
                        onClick={handleTakeOut}
                        class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-caption font-medium
                               bg-[var(--bg-app)] border border-[var(--color-border)] text-[var(--text-secondary)]
                               hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        <ArrowUpRight size={12} strokeWidth={2} />
                        <span>Take out</span>
                      </button>
                    </>
                  ) : (
                    <span class="text-caption text-[var(--text-tertiary)]">—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* In Cameras */}
        {camerasWithStock.value.length > 0 && (
          <div class="bg-[var(--bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-separator)]">
              <Camera size={16} strokeWidth={1.5} class="text-[var(--text-secondary)]" />
              <p class="text-section-title">In Cameras</p>
            </div>
            {camerasWithStock.value.map((lf) => (
              <div key={lf.id} class="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-separator)] last:border-b-0">
                <Camera size={18} strokeWidth={1.5} class="text-[var(--text-secondary)]" />
                <div class="flex-1 min-w-0">
                  <p class="text-body">{lf.camera.name}</p>
                  <p class="text-caption text-[var(--text-tertiary)]">
                    Loaded {formatRelative(lf.loadedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Finished Rolls */}
        {finishedWithStock.value.length > 0 && (
          <div class="bg-[var(--bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-separator)]">
              <ClipboardList size={16} strokeWidth={1.5} class="text-[var(--text-secondary)]" />
              <p class="text-section-title">Finished Rolls · {finishedWithStock.value.length}</p>
            </div>
            {finishedWithStock.value.slice(0, 5).map((r) => (
              <div key={r.id} class="px-4 py-3 border-b border-[var(--color-separator)] last:border-b-0">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <p class="text-body">{r.camera.name}</p>
                    <p class="text-caption text-[var(--text-secondary)] mt-0.5">
                      {formatDateFull(r.finishedAt)}
                      {r.frameCount ? ` · ${r.frameCount} exp` : ''}
                    </p>
                  </div>
                </div>
                {r.notes && <p class="text-caption text-[var(--text-tertiary)] mt-1">{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Edit Stock Sheet */}
      {showEditStock.value && (
        <Modal open={true} onClose={() => (showEditStock.value = false)} title="Edit Stock" variant="sheet">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Name</label>
              <input type="text" value={editStockForm.name.value} onInput={(e) => (editStockForm.name.value = (e.target as HTMLInputElement).value)}
                class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Brand</label>
              <input type="text" value={editStockForm.brand.value} onInput={(e) => (editStockForm.brand.value = (e.target as HTMLInputElement).value)}
                class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div class="flex gap-3">
              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-caption text-[var(--text-secondary)]">Type</label>
                <div class="flex gap-1">
                  {FILM_TYPE_OPTIONS.map((t) => (
                    <button key={t.value} onClick={() => (editStockForm.type.value = t.value)}
                      class={`flex-1 px-2 py-2 rounded-lg text-caption font-medium border transition-colors
                        ${editStockForm.type.value === t.value ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--color-border)]'}`}
                    >{t.label}</button>
                  ))}
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-caption text-[var(--text-secondary)]">ISO</label>
                <Stepper value={editStockForm.iso.value} onChange={(v) => (editStockForm.iso.value = v)} min={25} max={6400} />
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Notes</label>
              <textarea value={editStockForm.notes.value} onInput={(e) => (editStockForm.notes.value = (e.target as HTMLTextAreaElement).value)} rows={2}
                class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] resize-none" />
            </div>
            <div class="flex gap-2">
              <button
                onClick={async () => {
                  savingStockDetail.value = true
                  try {
                    await updateStock(s.id, { name: editStockForm.name.value.trim(), brand: editStockForm.brand.value.trim(), type: editStockForm.type.value, iso: editStockForm.iso.value, notes: editStockForm.notes.value.trim() || undefined })
                    showEditStock.value = false
                  } catch (err) { console.error(err) }
                  finally { savingStockDetail.value = false }
                }}
                disabled={savingStockDetail.value || !editStockForm.name.value.trim()}
                class="flex-1 px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white text-body font-semibold disabled:opacity-40"
              >
                {savingStockDetail.value ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={async () => {
                  try { await deleteStock(s.id); showEditStock.value = false; activeTab.value = 'inventory' }
                  catch (err: any) { alert(err.message) }
                }}
                class="px-5 py-3 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-body font-semibold"
              >
                <Trash2 size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Variant Sheet */}
      {showAddVariant.value && (
        <Modal open={true} onClose={() => (showAddVariant.value = false)} title="Add Variant" variant="sheet">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Name</label>
              <input type="text" value={newVariantName.value} onInput={(e) => (newVariantName.value = (e.target as HTMLInputElement).value)}
                placeholder="e.g. Dubblelab respool"
                class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Format</label>
              <SegmentedControl options={FORMAT_OPTIONS} value={newVariantFormat.value} onChange={(v) => (newVariantFormat.value = v)} />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">DX Coded</label>
              <label class="flex items-center gap-3 py-1 cursor-pointer">
                <div
                  class={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
                    ${newVariantDxCoded.value
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                      : 'border-[var(--color-border)] bg-[var(--bg-card)]'
                    }`}
                  onClick={() => (newVariantDxCoded.value = !newVariantDxCoded.value)}
                >
                  {newVariantDxCoded.value && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span class="text-body text-[var(--text-secondary)]">DX Coded</span>
              </label>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex flex-col gap-1.5 flex-1">
                <label class="text-caption text-[var(--text-secondary)]">Quantity</label>
                <Stepper value={newVariantQty.value} onChange={(v) => (newVariantQty.value = v)} min={1} max={100} />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-caption text-[var(--text-secondary)]">Location</label>
                <SegmentedControl options={LOC_OPTIONS} value={newVariantLocation.value} onChange={(v) => (newVariantLocation.value = v)} />
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Notes (optional)</label>
              <textarea value={newVariantNotes.value} onInput={(e) => (newVariantNotes.value = (e.target as HTMLTextAreaElement).value)} rows={2}
                placeholder="e.g. non-DX, respooled"
                class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] resize-none" />
            </div>
            <button
              onClick={async () => {
                if (!newVariantName.value.trim()) return
                addingVariant.value = true
                try {
                  const vid = await addVariant({
                    stockId: s.id,
                    name: newVariantName.value.trim(),
                    format: newVariantFormat.value,
                    dxCoded: newVariantDxCoded.value,
                    notes: newVariantNotes.value.trim() || undefined,
                  })
                  await addInventoryItem({
                    variantId: vid,
                    quantity: newVariantQty.value,
                    location: newVariantLocation.value,
                  })
                  showAddVariant.value = false
                } catch (err) { console.error(err) }
                finally { addingVariant.value = false }
              }}
              disabled={addingVariant.value || !newVariantName.value.trim()}
              class="w-full px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white text-body font-semibold disabled:opacity-40"
            >
              {addingVariant.value ? 'Adding…' : 'Add to Inventory'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Variant Sheet (detail) */}
      {editingVariantDetailId.value && (
        <Modal open={true} onClose={() => (editingVariantDetailId.value = null)} title="Edit Variant" variant="sheet">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Name</label>
              <input type="text" value={editDetailVariantName.value} onInput={(e) => (editDetailVariantName.value = (e.target as HTMLInputElement).value)}
                class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">DX Coded</label>
              <label class="flex items-center gap-3 py-1 cursor-pointer">
                <div
                  class={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
                    ${editDetailVariantDxCoded.value
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                      : 'border-[var(--color-border)] bg-[var(--bg-card)]'
                    }`}
                  onClick={() => (editDetailVariantDxCoded.value = !editDetailVariantDxCoded.value)}
                >
                  {editDetailVariantDxCoded.value && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span class="text-body text-[var(--text-secondary)]">DX Coded</span>
              </label>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-caption text-[var(--text-secondary)]">Notes</label>
              <textarea value={editDetailVariantNotes.value} onInput={(e) => (editDetailVariantNotes.value = (e.target as HTMLTextAreaElement).value)} rows={2}
                class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent)] resize-none" />
            </div>
            <div class="flex gap-2">
              <button
                onClick={async () => {
                  savingDetailVariant.value = true
                  try {
                    await updateVariant(editingVariantDetailId.value!, { name: editDetailVariantName.value.trim(), dxCoded: editDetailVariantDxCoded.value, notes: editDetailVariantNotes.value.trim() || undefined })
                    editingVariantDetailId.value = null
                  } catch (err) { console.error(err) }
                  finally { savingDetailVariant.value = false }
                }}
                disabled={savingDetailVariant.value || !editDetailVariantName.value.trim()}
                class="flex-1 px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white text-body font-semibold disabled:opacity-40"
              >
                {savingDetailVariant.value ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('Delete this variant? This removes all inventory for it.')) return
                  await deleteVariant(editingVariantDetailId.value!)
                  editingVariantDetailId.value = null
                }}
                class="px-5 py-3 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-body font-semibold"
              >
                <Trash2 size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Move Quantity Sheet for detail page */}
      {moveFromDetail.value && (
        <Modal open={true} onClose={() => (moveFromDetail.value = null)} variant="sheet">
          <div class="flex flex-col gap-4 pt-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--text-secondary)]">
                {moveFromDetail.value.to === 'fridge' ? <ThermometerSnowflake size={18} /> : <ArrowUpRight size={18} />}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-body font-semibold">
                  {moveFromDetail.value.to === 'fridge' ? 'Store away' : 'Take with you'}
                </p>
                <p class="text-caption text-[var(--text-secondary)] truncate">
                  {moveFromDetail.value.variantName} ({moveFromDetail.value.variantFormat})
                </p>
              </div>
            </div>

            <div class="flex flex-col items-center gap-2 py-2">
              <p class="text-caption text-[var(--text-tertiary)]">How many rolls?</p>
              <Stepper value={moveDetailQty.value} onChange={(v) => (moveDetailQty.value = v)} min={1} max={moveFromDetail.value.maxQty} />
              {moveDetailQty.value === moveFromDetail.value.maxQty ? (
                <span class="text-caption text-[var(--text-tertiary)]">All {moveFromDetail.value.maxQty} roll{moveFromDetail.value.maxQty !== 1 ? 's' : ''}</span>
              ) : (
                <span class="text-caption text-[var(--text-secondary)]">
                  {moveFromDetail.value.maxQty - moveDetailQty.value} will stay {moveFromDetail.value.from === 'with-me' ? 'with you' : 'stored'}
                </span>
              )}
            </div>

            <button
              onClick={async () => {
                const m = moveFromDetail.value!
                const items = invForStock.value.filter(i => i.variantId === m.variantId)
                const sourceItem = items.find(i => i.location === m.from)
                if (!sourceItem) return
                await moveInventory(sourceItem.id, m.to, moveDetailQty.value)
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
                moveFromDetail.value = null
              }}
              class="w-full px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white text-body font-semibold"
            >
              Move {moveDetailQty.value} roll{moveDetailQty.value !== 1 ? 's' : ''}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}


