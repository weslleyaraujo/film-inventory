interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div class="inline-flex bg-[var(--bg-card)] rounded-xl p-1 border border-[var(--color-border)]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          class={`px-4 py-2 rounded-lg text-caption font-medium transition-colors
            ${
              value === opt.value
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
