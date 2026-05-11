import { signal } from '@preact/signals'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { SegmentedControl } from '../ui/SegmentedControl'
import { addCamera } from '../../store/cameras'
import type { CameraConfig } from '../../db/types'

interface AddCameraModalProps {
  open: boolean
  onClose: () => void
}

const CAMERA_TYPE_OPTIONS: { value: CameraConfig['type']; label: string }[] = [
  { value: '35mm', label: '35mm' },
  { value: '120', label: '120' },
]

const name = signal('')
const cameraType = signal<CameraConfig['type']>('35mm')
const supports220 = signal(false)
const notes = signal('')
const submitting = signal(false)

function resetForm() {
  name.value = ''
  cameraType.value = '35mm'
  supports220.value = false
  notes.value = ''
  submitting.value = false
}

export function AddCameraModal({ open, onClose }: AddCameraModalProps) {
  const handleSubmit = async () => {
    if (!name.value.trim()) return
    submitting.value = true
    try {
      const config: CameraConfig =
        cameraType.value === '35mm'
          ? { type: '35mm' }
          : { type: '120', supports220: supports220.value || undefined }

      await addCamera({
        name: name.value.trim(),
        config,
        notes: notes.value.trim() || undefined,
      })
      resetForm()
      onClose()
    } catch (err) {
      console.error('Failed to add camera:', err)
    } finally {
      submitting.value = false
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Camera" variant="sheet">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Name</label>
          <input
            type="text"
            value={name}
            onInput={(e) => (name.value = (e.target as HTMLInputElement).value)}
            placeholder="e.g. Nikon F3"
            class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)]
                   rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                   focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Type</label>
          <SegmentedControl
            options={CAMERA_TYPE_OPTIONS}
            value={cameraType.value}
            onChange={(v) => (cameraType.value = v)}
          />
        </div>

        {cameraType.value === '120' && (
          <label class="flex items-center gap-3 py-1 cursor-pointer">
            <div
              class={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
                ${supports220.value
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                  : 'border-[var(--color-border)] bg-[var(--bg-card)]'
                }`}
              onClick={() => (supports220.value = !supports220.value)}
            >
              {supports220.value && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span class="text-body text-[var(--text-secondary)]">Supports 220 film</span>
          </label>
        )}

        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Notes (optional)</label>
          <textarea
            value={notes}
            onInput={(e) => (notes.value = (e.target as HTMLTextAreaElement).value)}
            placeholder="e.g. brassed, 1982 serial"
            rows={2}
            class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)]
                   rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                   focus:outline-none focus:border-[var(--color-accent)] resize-none"
          />
        </div>

        <Button fullWidth disabled={submitting.value || !name.value.trim()} onClick={handleSubmit}>
          {submitting.value ? 'Adding…' : 'Add Camera'}
        </Button>
      </div>
    </Modal>
  )
}
