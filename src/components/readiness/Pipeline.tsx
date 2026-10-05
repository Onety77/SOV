import { Link } from 'react-router-dom'
import { m, useReducedMotion } from 'motion/react'
import { Check, Lock } from 'lucide-react'
import type { Coin } from '@/lib/types'
import { cn } from '@/lib/cn'
import { useNow } from '@/lib/clock'
import { clock, span, usd } from '@/lib/format'
import { opensAt, stageOf, windowElapsed } from '@/lib/readiness'
import { INITIAL_LEVERAGE, WINDOW_H } from '@/lib/rules'
import { EASE_OUT } from '@/lib/motion'
import { useCoins } from '@/lib/session'
import { CoinMark } from '@/components/ui/CoinMark'

const WINDOW_MS = WINDOW_H * 3_600_000

/** The coin to follow: one that just opened perps, else the one closest to opening. */
function featured(all: Coin[], now: number) {
  const recent = all.find((c) => stageOf(c, now) === 'perps' && opensAt(c)! > now - 90_000)
  if (recent) return recent
  return all.filter((c) => stageOf(c, now) === 'observation').sort((a, b) => opensAt(a)! - opensAt(b)!)[0]
}

/** A quarter of the ring, drawn clockwise from the top with a small gap. */
function arc(i: number, r: number, frac = 1) {
  const gap = 7
  const a0 = ((i * 90 + gap / 2 - 90) * Math.PI) / 180
  const a1 = ((i * 90 + gap / 2 + (90 - gap) * frac - 90) * Math.PI) / 180
  const large = (90 - gap) * frac > 180 ? 1 : 0
  return `M ${100 + r * Math.cos(a0)} ${100 + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${100 + r * Math.cos(a1)} ${100 + r * Math.sin(a1)}`
}

/**
 * The live model: one real coin moving through the pipeline. The ring is the four stages;
 * the third quarter fills as the observation window runs; when it closes, the last
 * quarter lights and the coin's perps open, right here, while you watch.
 */
export function Pipeline({ delay = 0, play = true, className }: { delay?: number; play?: boolean; className?: string }) {
  const now = useNow()
  const reduced = useReducedMotion()
  const coin = featured(useCoins(), now)
  if (!coin) return null
  const stage = stageOf(coin, now)
  const elapsed = windowElapsed(coin, now)
  const open = stage === 'perps'
  const fracs = [1, 1, Math.min(1, elapsed / WINDOW_MS), open ? 1 : 0]
  const left = (opensAt(coin) ?? now) - now

  const steps = [
    { name: 'Curve', detail: `Graduated ${span(now - coin.graduatedAt!)} ago`, state: 'done' as const },
    { name: 'PumpSwap spot', detail: `Canonical pool · ${usd(coin.liquidity ?? 0)}`, state: 'done' as const },
    { name: 'Readiness', detail: open ? `Held ${WINDOW_H}h unbroken` : `${span(elapsed)} of ${WINDOW_H}h observed`, state: open ? ('done' as const) : ('now' as const) },
    { name: `${INITIAL_LEVERAGE}x perps`, detail: open ? 'Long & short open' : `Opens in ${clock(left)}`, state: open ? ('done' as const) : ('locked' as const) },
  ]

  return (
    <m.div
      className={cn('relative overflow-hidden rounded-[20px] bg-surface/80 p-5 ring-1 ring-line-2 ring-inset backdrop-blur-sm sm:p-6', className)}
      initial={{ opacity: 0, y: 24 }}
      animate={play ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 1, delay, ease: EASE_OUT }}
    >
      <div className="flex items-center justify-between">
        <p className="label">Market pipeline</p>
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-accent-text uppercase">
          <span aria-hidden className="ping relative size-1.5 rounded-full bg-accent" />
          Live model
        </p>
      </div>

      <div className="relative mx-auto mt-4 aspect-square w-[min(230px,70%)]">
        <svg viewBox="0 0 200 200" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <circle cx="100" cy="100" r="94" fill="none" stroke="var(--line-2)" strokeDasharray="1 5" />
          {fracs.map((f, i) => (
            <g key={i}>
              <path d={arc(i, 78)} fill="none" stroke="var(--raised)" strokeWidth="6" strokeLinecap="round" />
              {f > 0 && (
                <m.path
                  d={arc(i, 78, Math.max(0.02, f))}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={reduced ? false : { pathLength: 0 }}
                  animate={{ pathLength: play ? 1 : 0 }}
                  transition={{ duration: 0.7, delay: delay + 0.4 + i * 0.25, ease: EASE_OUT }}
                />
              )}
            </g>
          ))}
          {/* a satellite circling: the market is live the whole way round */}
          <g className="spin-slow origin-center [transform-box:view-box]">
            <circle cx="100" cy="6" r="3.5" fill="var(--accent-text)" />
            <circle cx="100" cy="6" r="8" fill="var(--accent)" opacity="0.25" />
          </g>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <Link to={`/markets/${coin.id}`} className="flex flex-col items-center gap-2 rounded-full p-2">
            <CoinMark coin={coin} size={52} />
            <span className="font-display text-[17px] font-[680] tracking-[-0.02em] [font-stretch:110%]">{coin.symbol}</span>
          </Link>
        </div>
      </div>

      <ol className="mt-5 space-y-1">
        {steps.map((s, i) => (
          <li key={s.name} className="flex items-center gap-3.5 rounded-[11px] px-1 py-2">
            <span
              aria-hidden
              className={cn(
                'relative grid size-7 shrink-0 place-items-center rounded-full font-mono text-[11px] font-medium transition-colors duration-500',
                s.state === 'done' && 'bg-accent-strong text-on-accent',
                s.state === 'now' && 'text-accent-text ring-[1.5px] ring-accent ring-inset',
                s.state === 'locked' && 'text-ink-3 ring-1 ring-line-2 ring-inset',
              )}
            >
              {s.state === 'done' ? <Check className="size-3.5" strokeWidth={3} /> : s.state === 'now' ? <span className="breathe size-1.5 rounded-full bg-accent" /> : <Lock className="size-3" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn('block text-[14px] font-semibold', s.state === 'locked' && 'text-ink-2')}>
                <span className="sr-only">Step {i + 1}: </span>
                {s.name}
              </span>
              <span className="block truncate font-mono text-[12px] text-ink-3 tabular">{s.detail}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid grid-cols-2 border-t border-line pt-4">
        <p>
          <span className="label block">Spot</span>
          <span className="mt-1 block font-mono text-[13px] font-medium">Remains live</span>
        </p>
        <p className="border-l border-line pl-4">
          <span className="label block">Initial leverage</span>
          <span className="mt-1 block font-mono text-[13px] font-medium">{INITIAL_LEVERAGE.toFixed(1)}x</span>
        </p>
      </div>
    </m.div>
  )
}
