import { Search, X } from 'lucide-preact'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }: SearchInputProps) {
  return (
    <div class="relative">
      <Search
        size={16}
        strokeWidth={1.5}
        class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        class="w-full pl-9 pr-8 py-2.5 bg-[var(--bg-card)] border border-[var(--color-border)]
               rounded-xl text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
               focus:outline-none focus:border-[var(--color-accent)]"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          <X size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
