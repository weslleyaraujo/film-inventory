import { signal } from '@preact/signals'
import { computed } from '@preact/signals'
import { ArrowLeft, Camera as CameraIcon, Hash } from 'lucide-preact'
import { cameras, getLoadedFilmByCamera } from '../store/cameras'
import { getCameraFormats } from '../db/types'
import { getRollsByCamera, updateFinishedRoll } from '../store/rolls'
import { activeTab, selectedCameraId } from '../store/ui'
import { formatRelative, formatDateFull } from '../lib/date'
import { TypeDot } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadFilmModal } from '../components/cameras/LoadFilmModal'
import { FinishRollModal } from '../components/cameras/FinishRollModal'

const showLoadModal = signal(false)
const showFinishModal = signal(false)

export function CameraDetailScreen() {
  const camera = computed(() => {
    if (!selectedCameraId.value) return undefined
    return cameras.value.find((c) => c.id === selectedCameraId.value)
  })

  const loaded = computed(() => {
    if (!selectedCameraId.value) return undefined
    return getLoadedFilmByCamera(selectedCameraId.value)
  })

  const recentRolls = computed(() => {
    if (!selectedCameraId.value) return []
    return getRollsByCamera(selectedCameraId.value).slice(0, 5)
  })

  if (!camera.value) return null
  const cam = camera.value

  return (
    <div class="flex flex-col min-h-full pb-4">
      {/* Header */}
      <header class="flex items-center gap-3 px-5 pt-[calc(16px+var(--safe-top))] pb-4">
        <button
          onClick={() => (activeTab.value = 'cameras')}
          class="p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <h1 class="text-screen-title flex-1 truncate">{cam.name}</h1>
      </header>

      <section class="px-5 flex flex-col gap-4">
        {/* Camera info */}
        <Card class="p-4">
          <div class="flex items-center gap-3 mb-3">
            <CameraIcon size={24} strokeWidth={1.5} class="text-[var(--text-secondary)]" />
            <div>
              <p class="text-body font-semibold">{cam.name}</p>
              <p class="text-caption text-[var(--text-secondary)]">{getCameraFormats(cam.config).join(' · ')}</p>
            </div>
          </div>
          {cam.notes && <p class="text-caption text-[var(--text-tertiary)]">{cam.notes}</p>}
        </Card>

        {/* Loaded film — or empty state */}
        {loaded.value ? (
          <Card class="p-4">
            <p class="text-brand text-[var(--text-tertiary)] mb-2">Loaded Film</p>
            <div class="flex items-center gap-3">
              <TypeDot type={loaded.value.variant.stock.type} size="md" />
              <div class="flex-1 min-w-0">
                <p class="text-body font-semibold truncate">{loaded.value.variant.name}</p>
                <p class="text-caption text-[var(--text-secondary)]">
                  {loaded.value.variant.stock.name} · ISO {loaded.value.variant.stock.iso} · {loaded.value.variant.format}
                </p>
                <p class="text-caption text-[var(--text-tertiary)] mt-1">
                  Loaded {formatRelative(loaded.value.loadedAt)}
                  {loaded.value.frameCount ? ` · ${loaded.value.frameCount} exp` : ''}
                </p>
                {loaded.value.notes && (
                  <p class="text-caption text-[var(--text-tertiary)] mt-1">{loaded.value.notes}</p>
                )}
              </div>
            </div>
            <div class="mt-4">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => (showFinishModal.value = true)}
              >
                Finish Roll
              </Button>
            </div>
          </Card>
        ) : (
          <Card class="p-4">
            <EmptyState
              icon={<CameraIcon size={40} strokeWidth={1} />}
              title="No film loaded"
              description="Load a film to start tracking"
              action={
                <Button onClick={() => (showLoadModal.value = true)}>
                  Load Film
                </Button>
              }
            />
          </Card>
        )}

        {/* Recent rolls */}
        {recentRolls.value.length > 0 && (
          <Card>
            <div class="px-4 py-3 border-b border-[var(--color-separator)]">
              <p class="text-section-title">Recent Rolls</p>
            </div>
            {recentRolls.value.map((r) => (
              <div key={r.id} class="px-4 py-3 border-b border-[var(--color-separator)] last:border-b-0">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <p class="text-body truncate">{r.variant.name}</p>
                    <p class="text-caption text-[var(--text-secondary)] mt-0.5">
                      {formatDateFull(r.finishedAt)}
                      {r.frameCount ? ` · ${r.frameCount} exp` : ''}
                    </p>
                    <div class="flex items-center gap-1.5 mt-1.5">
                      <Hash size={11} strokeWidth={1.5} class="text-[var(--text-tertiary)] flex-shrink-0" />
                      <input
                        type="text"
                        value={r.twinCheckNumber || ''}
                        onBlur={(e) => {
                          const val = (e.target as HTMLInputElement).value.trim()
                          updateFinishedRoll(r.id, { twinCheckNumber: val || undefined })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                        }}
                        placeholder="Twin check #"
                        class="text-caption text-[var(--text-secondary)] bg-transparent border-b border-[var(--color-separator)] focus:border-[var(--color-accent)] focus:outline-none pb-0.5 w-28 placeholder:text-[var(--text-tertiary)]"
                      />
                    </div>
                  </div>
                </div>
                {r.notes && <p class="text-caption text-[var(--text-tertiary)] mt-1 truncate">{r.notes}</p>}
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* Modals */}
      <LoadFilmModal
        open={showLoadModal.value}
        onClose={() => (showLoadModal.value = false)}
        cameraId={selectedCameraId.value ?? ''}
        cameraFormats={getCameraFormats(cam.config)}
        cameraName={cam.name}
      />
      <FinishRollModal
        open={showFinishModal.value}
        onClose={() => (showFinishModal.value = false)}
        cameraId={selectedCameraId.value ?? ''}
      />
    </div>
  )
}
