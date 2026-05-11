import type { ComponentChildren } from 'preact'

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'

interface ButtonProps {
  children: ComponentChildren
  variant?: ButtonVariant
  fullWidth?: boolean
  disabled?: boolean
  class?: string
  onClick?: () => void
  type?: 'button' | 'submit'
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white border-[var(--color-accent)] active:bg-[var(--color-accent-pressed)]',
  secondary:
    'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--color-border)] active:bg-[var(--bg-elevated)]',
  destructive:
    'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] border-[var(--color-destructive)]/20 active:bg-[var(--color-destructive)]/20',
  ghost:
    'bg-transparent text-[var(--text-secondary)] border-transparent active:bg-[var(--bg-card)]',
}

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  class: extraClass = '',
  onClick,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      class={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[var(--radius-button)]
        text-body font-semibold border transition-colors
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 pointer-events-none' : ''}
        ${extraClass}`}
    >
      {children}
    </button>
  )
}
