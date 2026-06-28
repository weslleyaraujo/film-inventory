import {
  totalFinishedRolls,
  totalFrames,
  breakdownByType,
  breakdownByFormat,
  breakdownByBrand,
  breakdownByISO,
  topStocks,
  rollsByMonthLast12,
} from '../store/rolls'
import { Modal } from '../components/ui/Modal'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'

interface LogStatsModalProps {
  open: boolean
  onClose: () => void
}

function BarRow({ label, count, max, accent }: { label: string; count: number; max: number; accent?: boolean }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div class="flex items-center gap-3">
      <span class="text-caption text-[var(--text-secondary)] w-20 flex-shrink-0 truncate">{label}</span>
      <div class="flex-1 h-5 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--color-border)]">
        <div
          class={`h-full rounded-full transition-all duration-500 ${accent ? 'bg-[var(--color-accent)]' : 'bg-[var(--text-primary)]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span class="text-mono text-[var(--text-primary)] w-8 text-right">{count}</span>
    </div>
  )
}

/** Small horizontal bar for the monthly chart — different visual style */
function MonthBar({ label, count, max }: { label: string; count: number; max: number }) {
  const height = max > 0 ? Math.max((count / max) * 100, count > 0 ? 4 : 0) : 0
  return (
    <div class="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span class="text-mono text-[var(--text-primary)] text-xs">{count || ''}</span>
      <div class="w-full flex justify-center items-end h-20">
        <div
          class="w-full max-w-[28px] rounded-t-md bg-[var(--text-primary)] transition-all duration-500"
          style={{ height: `${height}%` }}
        />
      </div>
      <span class="text-caption text-[var(--text-tertiary)] text-[10px]">{label}</span>
    </div>
  )
}

const typeLabels: Record<string, string> = {
  'color-negative': 'Color Negative',
  'color-positive': 'Color Positive',
  bw: 'B&W',
}

export function LogStatsModal({ open, onClose }: LogStatsModalProps) {
  const typeData = breakdownByType.value
  const formatData = breakdownByFormat.value
  const brandData = breakdownByBrand.value
  const isoData = breakdownByISO.value
  const stocks = topStocks.value
  const monthlyData = rollsByMonthLast12.value

  const maxType = Math.max(...typeData.map((d) => d.count), 1)
  const maxFormat = Math.max(...formatData.map((d) => d.count), 1)
  const maxBrand = Math.max(...brandData.map((d) => d.count), 1)
  const maxISO = Math.max(...isoData.map((d) => d.count), 1)
  const maxStock = Math.max(...stocks.map((d) => d.count), 1)
  const maxMonthly = Math.max(...monthlyData.map((d) => d.count), 1)

  const hasData = typeData.length + formatData.length + brandData.length + isoData.length > 0

  return (
    <Modal open={open} onClose={onClose} title="Shooting Stats" variant="sheet">
      <div class="flex flex-col gap-6">
        {/* Summary card */}
        <div class="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--color-border)]">
          <div class="flex items-center gap-6">
            <div class="flex-1 text-center">
              <p class="text-hero text-[var(--text-primary)]">
                <AnimatedNumber value={totalFinishedRolls.value} />
              </p>
              <p class="text-caption text-[var(--text-tertiary)]">rolls finished</p>
            </div>
            <div class="w-px h-10 bg-[var(--color-separator)]" />
            <div class="flex-1 text-center">
              <p class="text-hero text-[var(--text-primary)]">
                <AnimatedNumber value={totalFrames.value} />
              </p>
              <p class="text-caption text-[var(--text-tertiary)]">frames shot</p>
            </div>
          </div>
        </div>

        {/* Rolls per Month */}
        {monthlyData.length > 0 && (
          <div class="flex flex-col gap-2">
            <p class="text-brand text-[var(--text-tertiary)]">Rolls per Month</p>
            <div class="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--color-border)]">
              <div class="flex items-end gap-1 justify-around">
                {monthlyData.map((d) => (
                  <MonthBar key={d.month} label={d.month} count={d.count} max={maxMonthly} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* By Type */}
        {typeData.length > 0 && (
          <div class="flex flex-col gap-2">
            <p class="text-brand text-[var(--text-tertiary)]">By Type</p>
            {typeData.map((d) => (
              <BarRow key={d.type} label={typeLabels[d.type] ?? d.type} count={d.count} max={maxType} accent />
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

        {/* Top Stocks */}
        {stocks.length > 0 && (
          <div class="flex flex-col gap-2">
            <p class="text-brand text-[var(--text-tertiary)]">Most Shot Stocks</p>
            {stocks.map((d, i) => (
              <BarRow
                key={d.name}
                label={d.name}
                count={d.count}
                max={maxStock}
                accent={i === 0}
              />
            ))}
          </div>
        )}

        {!hasData && (
          <p class="text-caption text-[var(--text-tertiary)] text-center py-4">
            Finish some rolls to see your stats
          </p>
        )}
      </div>
    </Modal>
  )
}
