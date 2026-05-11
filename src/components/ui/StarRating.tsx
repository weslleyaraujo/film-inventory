import { Star } from 'lucide-preact'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: number
}

export function StarRating({ value, onChange, readonly = false, size = 14 }: StarRatingProps) {
  return (
    <div class="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value
        const starClass = filled
          ? 'text-[var(--text-primary)] fill-[var(--text-primary)]'
          : 'text-[var(--color-separator)]'

        if (readonly || !onChange) {
          return <Star key={i} size={size} strokeWidth={1.5} class={starClass} />
        }

        return (
          <button key={i} onClick={() => onChange(i + 1)} class="p-0.5">
            <Star size={size} strokeWidth={1.5} class={`${starClass} transition-colors`} />
          </button>
        )
      })}
    </div>
  )
}
