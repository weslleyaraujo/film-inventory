import { signal } from '@preact/signals'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { getLoadedFilmByCamera, finishRoll } from '../../store/cameras'
import { formatRelative } from '../../lib/date'

interface FinishRollModalProps {
  open: boolean
  onClose: () => void
  cameraId: string
}

const pushStops = signal(0)
const finishNotes = signal('')
const submitting = signal(false)

function resetForm() {
  pushStops.value = 0
  finishNotes.value = ''
  submitting.value = false
}

export function FinishRollModal({ open, onClose, cameraId }: FinishRollModalProps) {
  const loaded = getLoadedFilmByCamera(cameraId)

  const handleSubmit = async () => {
    if (!cameraId) return
    submitting.value = true

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10, 50, 10])
    }

    try {
      const notesParts: string[] = []
      if (finishNotes.value.trim()) notesParts.push(finishNotes.value.trim())
      if (pushStops.value > 0) notesParts.push(`Pushed +${pushStops.value} stop${pushStops.value > 1 ? 's' : ''}`)
      if (pushStops.value < 0) notesParts.push(`Pulled ${Math.abs(pushStops.value)} stop${Math.abs(pushStops.value) > 1 ? 's' : ''}`)

      await finishRoll(cameraId, {
        notes: notesParts.join(' | ') || undefined,
      })
      resetForm()
      onClose()
    } catch (err) {
      console.error('Failed to finish roll:', err)
    } finally {
      submitting.value = false
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Finish Roll" variant="sheet">
      <div class="flex flex-col gap-4">
        {loaded && (
          <div class="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
            <p class="text-body font-semibold">{loaded.variant.name}</p>
            <p class="text-caption text-[var(--text-secondary)] mt-1">
              Loaded {formatRelative(loaded.loadedAt)}
              {loaded.frameCount ? ` · ${loaded.frameCount} exp` : ''}
            </p>
          </div>
        )}

        {/* Push/Pull stops */}
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Push/Pull (stops)</label>
          <div class="flex items-center gap-3">
            <button onClick={() => (pushStops.value = Math.max(-6, pushStops.value - 1))}
              class="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--text-secondary)] active:bg-[var(--bg-card)]">−</button>
            <span class={`text-mono font-semibold text-lg min-w-[3ch] text-center ${pushStops.value > 0 ? 'text-[var(--color-positive)]' : pushStops.value < 0 ? 'text-[var(--color-negative)]' : 'text-[var(--text-primary)]'}`}>
              {pushStops.value > 0 ? `+${pushStops.value}` : pushStops.value < 0 ? `${pushStops.value}` : '0'}
            </span>
            <button onClick={() => (pushStops.value = Math.min(6, pushStops.value + 1))}
              class="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--text-secondary)] active:bg-[var(--bg-card)]">+</button>
            <span class="text-caption text-[var(--text-tertiary)]">{pushStops.value === 0 ? 'Box speed' : pushStops.value > 0 ? `Pushed +${pushStops.value}` : `Pulled ${Math.abs(pushStops.value)}`} </span>
          </div>
        </div>

        {/* Notes */}
        <div class="flex flex-col gap-1.5">
          <label class="text-caption text-[var(--text-secondary)]">Notes</label>
          <textarea value={finishNotes} onInput={(e) => (finishNotes.value = (e.target as HTMLTextAreaElement).value)}
            placeholder="How did it turn out?"
            rows={3}
            class="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] resize-none" />
        </div>

        <Button fullWidth disabled={submitting.value} onClick={handleSubmit}>
          {submitting.value ? 'Finishing…' : 'Confirm & Finish'}
        </Button>
      </div>
    </Modal>
  )
}
