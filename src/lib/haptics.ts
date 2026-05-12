import { hapticsEnabled } from '../store/ui'

/**
 * Light micro-feedback tap (10ms).
 * Use for: button presses, toggles, navigation into detail views, stepper changes.
 */
export function lightTap(): void {
  if (!hapticsEnabled.value) return
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

/**
 * Confirmation buzz pattern (10ms → 50ms pause → 10ms).
 * Use for: form submits, creates, deletes, major state changes.
 */
export function confirmTap(): void {
  if (!hapticsEnabled.value) return
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([10, 50, 10])
  }
}
