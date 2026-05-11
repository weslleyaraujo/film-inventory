import { ClipboardList, Trash2, Hash } from 'lucide-preact'
import { finishedRollsWithDetails, totalFinishedRolls, mostShotStock, mostUsedCamera, deleteFinishedRoll, updateFinishedRoll } from '../store/rolls'
import { TypeDot } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDate, formatMonth } from '../lib/date'

export function LogScreen() {
  const rolls = finishedRollsWithDetails.value

  // Group by year then month
  const byYearMonth = new Map<string, Map<string, typeof rolls>>()
  for (const roll of rolls) {
    const d = new Date(roll.finishedAt)
    const year = d.getFullYear().toString()
    const month = formatMonth(d)
    if (!byYearMonth.has(year)) byYearMonth.set(year, new Map())
    const months = byYearMonth.get(year)!
    if (!months.has(month)) months.set(month, [])
    months.get(month)!.push(roll)
  }

  // Sort years descending
  const sortedYears = Array.from(byYearMonth.keys()).sort((a, b) => parseInt(b) - parseInt(a))

  return (
    <div class="flex flex-col min-h-full">
      <header class="px-5 pt-[calc(16px+var(--safe-top))] pb-4">
        <h1 class="text-screen-title">Log</h1>
      </header>

      {rolls.length > 0 && (
        <section class="px-5 pb-4">
          <div class="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--color-border)]">
            <div class="flex items-center gap-4">
              <div>
                <p class="text-hero text-[var(--text-primary)]">{totalFinishedRolls}</p>
                <p class="text-caption text-[var(--text-tertiary)]">rolls finished</p>
              </div>
              <div class="flex-1 min-w-0">
                {mostShotStock.value && (
                  <p class="text-caption text-[var(--text-secondary)] truncate">
                    Most shot: <span class="text-[var(--text-primary)] font-semibold">{mostShotStock.value.name}</span> ({mostShotStock.value.count}×)
                  </p>
                )}
                {mostUsedCamera.value && (
                  <p class="text-caption text-[var(--text-secondary)] truncate">
                    Most used: <span class="text-[var(--text-primary)] font-semibold">{mostUsedCamera.value.name}</span> ({mostUsedCamera.value.count}×)
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section class="px-5 pb-24 flex flex-col gap-6">
        {rolls.length === 0 ? (
          <EmptyState icon={<ClipboardList size={56} strokeWidth={1} />}
            title="No rolls finished yet" description="Finish a roll from the Cameras tab" />
        ) : (
          sortedYears.map((year) => {
            const months = byYearMonth.get(year)!
            const monthNames = Array.from(months.keys())
            // Sort months chronologically within year (descending)
            const monthOrder = ['January','February','March','April','May','June','July','August','September','October','November','December']
            const sortedMonths = monthNames.sort((a, b) => monthOrder.indexOf(b) - monthOrder.indexOf(a))

            return (
              <div key={year}>
                <h2 class="text-screen-title mb-1">{year}</h2>
                {sortedMonths.map((month) => (
                  <div key={month} class="mb-4">
                    <div class="flex items-center gap-3 mb-2 px-1">
                      <span class="text-brand text-[var(--text-tertiary)]">{month}</span>
                      <span class="flex-1 h-px bg-[var(--color-separator)]" />
                      <span class="text-caption text-[var(--text-tertiary)]">{months.get(month)!.length} roll{months.get(month)!.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="flex flex-col gap-2">
                      {months.get(month)!.map((roll) => (
                        <div key={roll.id} class="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--color-border)]">
                          <div class="flex items-start justify-between gap-2">
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 mb-1">
                                <TypeDot type={roll.variant.stock.type} />
                                <p class="text-body font-semibold truncate">{roll.variant.name}</p>
                              </div>
                              <p class="text-caption text-[var(--text-secondary)]">
                                {roll.camera.name} · {roll.variant.format}
                                {roll.frameCount ? ` · ${roll.frameCount} exp` : ''}
                              </p>
                              <div class="flex items-center gap-1.5 mt-1.5">
                                <Hash size={12} strokeWidth={1.5} class="text-[var(--text-tertiary)] flex-shrink-0" />
                                <input
                                  type="text"
                                  value={roll.twinCheckNumber || ''}
                                  onBlur={(e) => {
                                    const val = (e.target as HTMLInputElement).value.trim()
                                    updateFinishedRoll(roll.id, { twinCheckNumber: val || undefined })
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                                  }}
                                  placeholder="Twin check #"
                                  class="text-caption text-[var(--text-secondary)] bg-transparent border-b border-[var(--color-separator)] focus:border-[var(--color-accent)] focus:outline-none pb-0.5 w-28 placeholder:text-[var(--text-tertiary)]"
                                />
                              </div>
                              {roll.notes && (
                                <p class="text-caption text-[var(--text-tertiary)] mt-1.5 leading-relaxed">{roll.notes}</p>
                              )}
                              <p class="text-caption text-[var(--text-tertiary)] mt-1.5">
                                {formatDate(roll.finishedAt)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('Delete this finished roll from history?')) {
                                  deleteFinishedRoll(roll.id)
                                }
                              }}
                              class="p-1.5 -mr-1 -mt-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors flex-shrink-0"
                              aria-label="Delete roll"
                            >
                              <Trash2 size={16} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
