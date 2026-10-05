import type { Coin } from '@/lib/types'
import { cn } from '@/lib/cn'
import { curveShare, stageOf, windowElapsed } from '@/lib/readiness'
import { INITIAL_LEVERAGE, WINDOW_H } from '@/lib/rules'

/** Where this coin is across the four stages, as one rail. */
export function StageRail({ coin, now, className }: { coin: Coin; now: number; className?: string }) {
  const stage = stageOf(coin, now)
  const at = { curve: 0, spot: 1, observation: 2, perps: 3 }[stage]
  const elapsed = windowElapsed(coin, now)
  const parts = [
    { name: 'Bonding curve', short: 'Curve', fill: at > 0 ? 1 : curveShare(coin), note: at > 0 ? 'Graduated' : `${Math.round(curveShare(coin) * 100)}% raised` },
    { name: 'PumpSwap spot', short: 'Spot', fill: at > 0 ? 1 : 0, note: at > 0 ? 'Live' : 'Next' },
    { name: 'Readiness', short: 'Readiness', fill: at === 3 ? 1 : at === 2 ? elapsed / (WINDOW_H * 3_600_000) : 0, note: at === 3 ? 'Passed' : at === 2 ? `${Math.floor(elapsed / 3_600_000)}h / ${WINDOW_H}h` : at === 1 ? 'Blocked' : 'Locked' },
    { name: `${INITIAL_LEVERAGE}x perps`, short: 'Perps', fill: at === 3 ? 1 : 0, note: at === 3 ? 'Open' : 'Locked' },
  ]
  return (
    <ol className={cn('grid grid-cols-4 gap-1.5', className)} aria-label="Stages">
      {parts.map((p, i) => (
        <li key={p.name} className="min-w-0" aria-current={i === at ? 'step' : undefined}>
          <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-raised">
            <span className={cn('block h-full rounded-full transition-[width] duration-1000', i === at && at !== 3 ? 'bg-accent' : 'bg-accent-strong')} style={{ width: `${p.fill * 100}%` }} />
          </span>
          <span className={cn('mt-2.5 block truncate text-[13px] font-semibold', i > at && 'text-ink-3')}>
            <span className="sm:hidden">{p.short}</span>
            <span className="max-sm:hidden">{p.name}</span>
          </span>
          <span className="block truncate font-mono text-[11.5px] text-ink-3 tabular">{p.note}</span>
        </li>
      ))}
    </ol>
  )
}
