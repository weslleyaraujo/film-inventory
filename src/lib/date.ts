const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const dateFormatFull = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long' })
const relFormat = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

export function formatDate(date: Date | string): string {
  return dateFormat.format(new Date(date))
}

export function formatDateFull(date: Date | string): string {
  return dateFormatFull.format(new Date(date))
}

export function formatMonth(date: Date | string): string {
  return monthFormat.format(new Date(date))
}

export function formatRelative(date: Date | string): string {
  const d = new Date(date)
  const now = Date.now()
  const diffMs = d.getTime() - now
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === -1) return 'yesterday'
  if (diffDays === 1) return 'tomorrow'
  if (Math.abs(diffDays) < 30) return relFormat.format(diffDays, 'day')
  return dateFormat.format(d)
}
