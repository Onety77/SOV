import { cn } from '@/lib/cn'

/** A small closing-price line. Violet, because it's a shape, not a verdict. */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const W = 120
  const H = 32
  const hi = Math.max(...data)
  const lo = Math.min(...data)
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * W).toFixed(1)},${(2 + ((hi - v) / (hi - lo || 1)) * (H - 4)).toFixed(1)}`)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn('h-8 w-full overflow-visible', className)} aria-hidden>
      <polyline points={pts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
