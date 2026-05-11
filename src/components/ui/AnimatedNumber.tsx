import { useRef, useEffect } from 'preact/hooks'
import NumberFlow, { define } from 'number-flow'

// Register the web component once
if (typeof customElements !== 'undefined' && !customElements.get('number-flow')) {
  define('number-flow', NumberFlow)
}

interface Props {
  value: number
}

export function AnimatedNumber({ value }: Props) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const flowRef = useRef<NumberFlow | null>(null)

  // Create element once, outside Preact's VDOM
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const el = document.createElement('number-flow') as NumberFlow
    container.appendChild(el)
    el.update(value)
    flowRef.current = el

    return () => {
      el.remove()
      flowRef.current = null
    }
  }, [])

  // Update value directly on the DOM element whenever it changes
  useEffect(() => {
    if (flowRef.current) {
      flowRef.current.update(value)
    }
  }, [value])

  return <span ref={containerRef} style="display: contents" />
}
