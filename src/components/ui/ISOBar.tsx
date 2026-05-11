interface ISOBarProps {
  iso: number
  /** The maximum ISO value to normalize the bar to (default 800) */
  maxISO?: number
}

export function ISOBar({ iso, maxISO = 800 }: ISOBarProps) {
  const pct = Math.min((iso / maxISO) * 100, 100)

  return (
    <div class="flex items-center gap-2">
      <span class="text-mono text-[var(--text-secondary)] tabular-nums">ISO {iso}</span>
      <div class="flex-1 h-0.5 bg-[var(--color-separator)] rounded-full overflow-hidden">
        <div
          class="h-full bg-[var(--text-primary)] rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
