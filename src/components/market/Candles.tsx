import { useId, useMemo } from 'react'
import { m } from 'motion/react'
import { candles } from '@/lib/market'
import { price } from '@/lib/format'
import { cn } from '@/lib/cn'
import { EASE_IN_OUT } from '@/lib/motion'

interface Props {
  seed: string
  /** the price the sample history ends at */
  base: number
  change: number
  /** the live price: the last candle follows it */
  live?: number
  className?: string
}

/**
 * A seeded candlestick chart with volume, drawn to scale. It wipes in from the left on
 * arrival; afterwards the last candle and the price marker follow the live price.
 */
export function Candles({ seed, base, change, live = base, className }: Props) {
  const clip = useId().replace(/:/g, '')
  const history = useMemo(() => candles(seed, base, change), [seed, base, change])
  const data = useMemo(() => {
    const out = history.slice()
    const l = out[out.length - 1]
    out[out.length - 1] = { ...l, c: live, h: Math.max(l.h, live), l: Math.min(l.l, live) }
    return out
  }, [history, live])
  const W = 640
  const H = 260
  const VH = 40
  const hi = Math.max(...data.map((d) => d.h))
  const lo = Math.min(...data.map((d) => d.l))
  const vmax = Math.max(...data.map((d) => d.v))
  const y = (v: number) => 10 + ((hi - v) / (hi - lo || 1)) * (H - VH - 24)
  const cw = W / data.length
  const ticks = [0, 0.33, 0.66, 1].map((f) => lo + (hi - lo) * (1 - f))
  const top = (v: number) => `${(y(v) / H) * 100}%`

  return (
    <div className={cn('relative pr-16', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" role="img" aria-label={`Price chart, now ${price(live)}`}>
        <defs>
          <clipPath id={clip}>
            <m.rect x="0" y="0" height={H} initial={{ width: 0 }} animate={{ width: W }} transition={{ duration: 1.1, delay: 0.15, ease: EASE_IN_OUT }} />
          </clipPath>
        </defs>
        {ticks.map((t) => (
          <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} stroke="var(--line)" vectorEffect="non-scaling-stroke" />
        ))}
        <g clipPath={`url(#${clip})`}>
          {data.map((d, i) => {
            const up = d.c >= d.o
            const x = i * cw + cw / 2
            const col = up ? 'var(--up)' : 'var(--down)'
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={y(d.h)} y2={y(d.l)} stroke={col} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <rect x={x - cw * 0.32} width={cw * 0.64} y={y(Math.max(d.o, d.c))} height={Math.max(1, Math.abs(y(d.o) - y(d.c)))} fill={col} />
                <rect x={x - cw * 0.32} width={cw * 0.64} y={H - (d.v / vmax) * VH} height={(d.v / vmax) * VH} fill={col} opacity="0.25" />
              </g>
            )
          })}
          <line x1="0" x2={W} y1={y(live)} y2={y(live)} stroke="var(--ink-3)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      {ticks
        .filter((t) => Math.abs(y(t) - y(live)) > 16)
        .map((t) => (
          <span key={t} className="absolute right-0 -translate-y-1/2 font-mono text-[10px] text-ink-3" style={{ top: top(t) }}>
            {price(t)}
          </span>
        ))}
      <span className="absolute right-0 -translate-y-1/2 rounded-[4px] bg-accent-strong px-1 font-mono text-[10px] font-medium text-on-accent transition-[top] duration-500 ease-out" style={{ top: top(live) }}>
        {price(live)}
      </span>
    </div>
  )
}
