import type { ComponentChildren } from 'preact'

interface EmptyStateProps {
  icon: ComponentChildren
  title: string
  description?: string
  action?: ComponentChildren
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div class="flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
      <div class="text-[var(--text-tertiary)] mb-2">{icon}</div>
      <p class="text-body text-[var(--text-secondary)]">{title}</p>
      {description && <p class="text-caption text-[var(--text-tertiary)]">{description}</p>}
      {action && <div class="mt-2">{action}</div>}
    </div>
  )
}
