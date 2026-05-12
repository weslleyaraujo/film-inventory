import { signal } from '@preact/signals'
import { Camera as CameraIcon, Plus } from 'lucide-preact'
import { cameras, loadedFilmsWithDetails } from '../store/cameras'
import { getCameraFormats } from '../db/types'
import { activeTab, selectedCameraId } from '../store/ui'
import { TypeDot } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { AddCameraModal } from '../components/cameras/AddCameraModal'

const showAddModal = signal(false)

export function CameraListScreen() {
  return (
    <div class="flex flex-col min-h-full">
      <header class="px-5 pt-[calc(16px+var(--safe-top))] pb-4">
        <h1 class="text-screen-title">Cameras</h1>
      </header>

      <section class="px-5 pb-4">
        {cameras.value.length === 0 ? (
          <EmptyState
            icon={<CameraIcon size={56} strokeWidth={1} />}
            title="No cameras yet"
            description="Add a camera to track loaded film"
          />
        ) : (
          <div class="grid grid-cols-2 gap-3">
            {cameras.value.map((cam) => {
              const loaded = loadedFilmsWithDetails.value.find((lf) => lf.cameraId === cam.id)
              return (
                <button
                  key={cam.id}
                  onClick={() => {
                    selectedCameraId.value = cam.id
                    activeTab.value = 'camera-detail'
                  }}
                  class="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--color-border)]
                         text-left active:bg-[var(--bg-elevated)] transition-colors"
                >
                  <div class="flex items-start justify-between mb-2">
                    <CameraIcon size={20} strokeWidth={1.5} class="text-[var(--text-secondary)]" />
                    <span class="text-caption px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--text-secondary)]">
                      {getCameraFormats(cam.config).join('/')}
                    </span>
                  </div>
                  <p class="text-body font-semibold truncate">{cam.name}</p>
                  {loaded ? (
                    <div class="mt-2 pt-2 border-t border-[var(--color-separator)] flex items-center gap-1.5">
                      <TypeDot type={loaded.variant.stock.type} />
                      <span class="text-caption text-[var(--text-secondary)] truncate flex-1">
                        {loaded.variant.name}
                      </span>
                    </div>
                  ) : (
                    <p class="mt-2 text-caption text-[var(--text-tertiary)] flex items-center gap-1">
                      <CameraIcon size={12} strokeWidth={1.5} />
                      No film
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* FAB */}
      <button
        onClick={() => (showAddModal.value = true)}
        class="fixed right-5 w-14 h-14 rounded-2xl bg-[var(--color-accent)]
               text-white shadow-lg flex items-center justify-center z-10
               active:scale-95 transition-transform"
        style="bottom: calc(68px + env(safe-area-inset-bottom, 0px))"
        aria-label="Add camera"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <AddCameraModal open={showAddModal.value} onClose={() => (showAddModal.value = false)} />
    </div>
  )
}
