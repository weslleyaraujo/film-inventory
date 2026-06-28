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
  const diffDays = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (Math.abs(diffDays) < 30) return relFormat.format(diffDays, 'day')
  return dateFormat.format(d)
}
