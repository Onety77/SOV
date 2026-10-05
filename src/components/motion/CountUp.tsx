import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { EASE_OUT } from '@/lib/motion'

/**
 * A number that settles into place when the page arrives, then glides from old to new
 * whenever `value` changes. Writes straight to the DOM, so it never re-renders.
 */
export function CountUp({ value, format, duration = 1.1, delay = 0, className }: { value: number; format: (n: number) => string; duration?: number; delay?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const shown = useRef<number | null>(null)
  // inline formatters change identity every render; don't let that restart the count
  const fmt = useRef(format)
  useEffect(() => {
    fmt.current = format
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      el.textContent = fmt.current(value)
      shown.current = value
      return
    }
    const from = shown.current ?? 0
    if (from === value) return
    const c = animate(from, value, {
      duration: shown.current === null ? duration : 0.6,
      delay: shown.current === null ? delay : 0,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = fmt.current(v)
        shown.current = v
      },
    })
    return () => c.stop()
  }, [value, reduced, duration, delay])

  return (
    <span ref={ref} className={className} aria-label={format(value)}>
      {format(reduced ? value : 0)}
    </span>
  )
}
