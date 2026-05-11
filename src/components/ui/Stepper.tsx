import { useState, useRef, useEffect } from 'preact/hooks'
import { Minus, Plus } from 'lucide-preact'

interface StepperProps {
  value: number
  onChange: (newValue: number) => void
  min?: number
  max?: number
}

export function Stepper({ value, onChange, min = 0, max = 999 }: StepperProps) {
  const [pulse, setPulse] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  // Sync edit value when value changes externally
  useEffect(() => {
    setEditValue(String(value))
  }, [value])

  const triggerPulse = (newVal: number) => {
    setPulse(true)
    onChange(newVal)
    setTimeout(() => setPulse(false), 150)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  const commitEdit = () => {
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed))
      if (clamped !== value) {
        onChange(clamped)
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(10)
        }
      }
    }
    setEditing(false)
  }

  return (
    <div class="flex items-center gap-2">
      <button
        onClick={() => {
          if (value > min) triggerPulse(value - 1)
        }}
        disabled={value <= min}
        class="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)]
               text-[var(--text-secondary)] active:bg-[var(--bg-card)] disabled:opacity-30"
      >
        <Minus size={14} strokeWidth={2} />
      </button>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onInput={(e) => setEditValue((e.target as HTMLInputElement).value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') setEditing(false)
          }}
          min={min}
          max={max}
          class="w-12 h-7 text-center text-mono font-semibold bg-[var(--bg-app)] border border-[var(--color-accent)] rounded-lg text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <button
          onClick={() => {
            setEditValue(String(value))
            setEditing(true)
          }}
          class={`text-mono font-semibold min-w-[2ch] text-center px-1 hover:text-[var(--color-accent)] transition-colors ${pulse ? 'animate-count-pulse' : ''}`}
          title="Tap to edit"
        >
          {value}
        </button>
      )}
      <button
        onClick={() => {
          if (value < max) triggerPulse(value + 1)
        }}
        disabled={value >= max}
        class="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)]
               text-[var(--text-secondary)] active:bg-[var(--bg-card)] disabled:opacity-30"
      >
        <Plus size={14} strokeWidth={2} />
      </button>
    </div>
  )
}
