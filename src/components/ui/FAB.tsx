import type { ComponentChildren } from 'preact'

interface FABProps {
  onClick: () => void
  icon: ComponentChildren
  label: string
}

export function FAB({ onClick, icon, label }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      class="fixed right-5 w-14 h-14 rounded-2xl bg-[var(--color-accent)]
             text-white shadow-lg flex items-center justify-center z-10
             active:scale-95 transition-transform hover:brightness-110 bottom-[68px]"
    >
      {icon}
    </button>
  )
}
