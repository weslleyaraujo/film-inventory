type BadgeVariant = 'filled' | 'outlined'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  color?: string
  class?: string
}

export function Badge({ label, variant = 'outlined', color, class: extra = '' }: BadgeProps) {
  if (variant === 'filled' && color) {
    return (
      <span
        class={`inline-flex items-center px-2.5 py-0.5 rounded-md text-caption font-medium ${extra}`}
        style={{ backgroundColor: color + '1A', color }}
      >
        {label}
      </span>
    )
  }

  return (
    <span
      class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption border border-[var(--color-border)]
        text-[var(--text-secondary)] ${extra}`}
    >
      {label}
    </span>
  )
}

/** Small film type dot — subtle color */
export function TypeDot({
  type,
  size = 'sm',
}: {
  type: 'bw' | 'color-negative' | 'color-positive'
  size?: 'sm' | 'md'
}) {
  const colors: Record<string, string> = {
    'color-negative': 'var(--color-negative)',
    'color-positive': 'var(--color-positive)',
    bw: 'var(--color-bw)',
  }
  const dim = size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'

  return (
    <span
      class={`${dim} rounded-full flex-shrink-0`}
      style={{ backgroundColor: colors[type] }}
    />
  )
}
