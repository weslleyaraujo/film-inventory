import {
  breakdownByISO,
  breakdownByBrand,
  breakdownByType,
  breakdownByFormat,
  breakdownByLocation,
} from '../store/inventory'
import { Modal } from '../components/ui/Modal'

interface AnalyticsModalProps {
  open: boolean
  onClose: () => void
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div class="flex items-center gap-3">
      <span class="text-caption text-[var(--text-secondary)] w-20 flex-shrink-0">{label}</span>
      <div class="flex-1 h-5 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--color-border)]">
        <div
          class="h-full bg-[var(--text-primary)] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span class="text-mono text-[var(--text-primary)] w-8 text-right">{count}</span>
    </div>
  )
}

export function AnalyticsModal({ open, onClose }: AnalyticsModalProps) {
  const isoData = breakdownByISO.value
  const brandData = breakdownByBrand.value
  const typeData = breakdownByType.value
  const formatData = breakdownByFormat.value
  const locationData = breakdownByLocation.value

  const typeLabels: Record<string, string> = {
    'color-negative': 'Color Neg',
    'color-positive': 'Color Pos',
    bw: 'B&W',
  }

  const maxISO = Math.max(...isoData.map((d) => d.count), 1)
  const maxBrand = Math.max(...brandData.map((d) => d.count), 1)
  const maxType = Math.max(...typeData.map((d) => d.count), 1)
  const maxFormat = Math.max(...formatData.map((d) => d.count), 1)
  const maxLocation = Math.max(...locationData.map((d) => d.count), 1)

  return (
    <Modal open={open} onClose={onClose} title="Breakdown" variant="sheet">
      <div class="flex flex-col gap-6">
        {/* By Type */}
        {typeData.length > 0 && (
          <div class="flex flex-col gap-2">
            <p class="text-brand text-[var(--text-tertiary)]">By Type</p>
            {typeData.map((d) => (
              <BarRow key={d.type} label={typeLabels[d.type] ?? d.type} count={d.count} max={maxType} />
            ))}
          </div>
        )}

        {/* By ISO */}
        {isoData.length > 0 && (
          <div class="flex flex-col gap-2">
            <p class="text-brand text-[var(--text-tertiary)]">By ISO</p>
            {isoData.map((d) => (
              <BarRow key={d.iso} label={`ISO ${d.iso}`} count={d.count} max={maxISO} />
            ))}
          </div>
        )}

        {/* By Brand */}
        {brandData.length > 0 && (
          <div class="flex flex-col gap-2">
            <p class="text-brand text-[var(--text-tertiary)]">By Brand</p>
            {brandData.map((d) => (
              <BarRow key={d.brand} label={d.brand} count={d.count} max={maxBrand} />
            ))}
          </div>
        )}

        {/* By Format */}
        {formatData.length > 0 && (
          <div class="flex flex-col gap-2">
            <p class="text-brand text-[var(--text-tertiary)]">By Format</p>
            {formatData.map((d) => (
              <BarRow key={d.format} label={d.format} count={d.count} max={maxFormat} />
            ))}
          </div>
        )}

        {/* By Location */}
        {locationData.length > 0 && (
          <div class="flex flex-col gap-2">
            <p class="text-brand text-[var(--text-tertiary)]">By Location</p>
            {locationData.map((d) => (
              <BarRow
                key={d.location}
                label={d.location === 'with-me' ? 'With me' : 'Fridge'}
                count={d.count}
                max={maxLocation}
              />
            ))}
          </div>
        )}

        {isoData.length === 0 && brandData.length === 0 && (
          <p class="text-caption text-[var(--text-tertiary)] text-center py-4">
            No data to show
          </p>
        )}
      </div>
    </Modal>
  )
}
