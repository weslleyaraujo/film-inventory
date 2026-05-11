import type { ComponentChildren } from 'preact'

interface CardProps {
  children: ComponentChildren
  class?: string
  onClick?: () => void
}

export function Card({ children, class: extra = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      class={`bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--color-border)]
        ${onClick ? 'cursor-pointer active:bg-[var(--bg-elevated)]' : ''}
        ${extra}`}
    >
      {children}
    </div>
  )
}
