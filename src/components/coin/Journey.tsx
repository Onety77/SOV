import { Check, Lock } from 'lucide-react'
import type { Coin } from '@/lib/types'
import { cn } from '@/lib/cn'
import { columns } from '@/lib/board'
import { span, usd } from '@/lib/format'
import { useQuote } from '@/lib/live'
import { checks, curveShare, opensAt, stageOf, windowElapsed } from '@/lib/readiness'
import { CURVE_TARGET_SOL, INITIAL_LEVERAGE, WINDOW_H } from '@/lib/rules'
import { CheckRow } from '@/components/readiness/CheckRow'

/**
 * The coin's path through the four stages. Stages it has passed collapse to a fact,
 * the stage it is in opens up with its live detail, and the ones ahead say what they need.
 */
export function Journey({ coin, now, className }: { coin: Coin; now: number; className?: string }) {
  const q = useQuote(coin.id)
  const stage = stageOf(coin, now)
  const at = columns.findIndex((c) => c.stage === stage)
  const live = { ...coin, raisedSol: q.raisedSol ?? coin.raisedSol }
  const done = (i: number) => i < at || (i === 3 && at === 3)

  const facts = [
    at > 0 ? `Graduated ${span(now - coin.graduatedAt!)} ago at ${CURVE_TARGET_SOL} SOL` : `${Math.round(curveShare(live) * 100)}% of ${CURVE_TARGET_SOL} SOL raised`,
    at > 0 ? `Canonical pool live · ${usd(coin.liquidity ?? 0)}` : 'Opens at graduation',
    at > 2 ? `Held ${WINDOW_H}h unbroken` : at === 2 ? `${span(windowElapsed(coin, now))} of ${WINDOW_H}h observed` : at === 1 ? 'Waiting for every check to hold' : `Four checks, then ${WINDOW_H}h unbroken`,
    at === 3 ? `${INITIAL_LEVERAGE}x long & short open` : at === 2 ? `Opens in ${span((opensAt(coin) ?? now) - now)}` : `${INITIAL_LEVERAGE}x, after readiness`,
  ]

  return (
    <ol className={cn('relative', className)}>
      {columns.map((col, i) => {
        const current = i === at && at !== 3 ? true : i === 3 && at === 3
        return (
          <li key={col.stage} className="relative grid grid-cols-[28px_1fr] gap-x-3.5 pb-5 last:pb-0">
            {i < 3 && <span aria-hidden className={cn('absolute top-8 bottom-0 left-[13.5px] w-px', i < at ? 'bg-accent' : 'bg-line-2')} />}
            <span
              aria-hidden
              className={cn(
                'relative grid size-7 place-items-center rounded-full font-mono text-[11px]',
                done(i) && !current && 'bg-accent-strong text-on-accent',
                current && 'bg-bg text-accent-text ring-[1.5px] ring-accent ring-inset',
                i > at && 'bg-bg text-ink-3 ring-1 ring-line-2 ring-inset',
              )}
            >
              {done(i) && !current ? <Check className="size-3.5" strokeWidth={3} /> : i > at ? i === 3 ? <Lock className="size-3" /> : col.n : <span className="breathe size-1.5 rounded-full bg-accent" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn('text-[15px] font-semibold', i > at && 'text-ink-2')}>
                <span className="sr-only">{done(i) && !current ? 'Done: ' : current ? 'Now: ' : 'Ahead: '}</span>
                {col.name}
              </p>
              <p className="mt-0.5 font-mono text-[12px] text-ink-3 tabular">{facts[i]}</p>
              {current && <Now coin={live} now={now} stage={col.stage} />}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function Now({ coin, now, stage }: { coin: Coin; now: number; stage: string }) {
  if (stage === 'curve') {
    const s = curveShare(coin)
    return (
      <div className="mt-3 rounded-[12px] bg-raised/60 p-3.5">
        <div className="h-2 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${s * 100}%` }} />
        </div>
        <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">
          {(coin.raisedSol ?? 0).toFixed(1)} of {CURVE_TARGET_SOL} SOL. At the threshold it graduates into one canonical PumpSwap pool, and spot trading carries on there.
        </p>
      </div>
    )
  }
  if (stage === 'perps') {
    const p = coin.perps
    return (
      <dl className="mt-3 grid grid-cols-3 gap-3 rounded-[12px] bg-raised/60 p-3.5">
        {[
          ['Open interest', p?.openInterest ? usd(p.openInterest) : '—'],
          ['Long', p?.openInterest ? `${Math.round(p.longShare * 100)}%` : '—'],
          ['Funding 1h', p?.openInterest ? `${(p.fundingHourly * 100).toFixed(3)}%` : '—'],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="truncate text-[12px] text-ink-3">{k}</dt>
            <dd className="mt-0.5 font-mono text-[14px] font-medium tabular">{v}</dd>
          </div>
        ))}
      </dl>
    )
  }
  const elapsed = windowElapsed(coin, now)
  return (
    <ul className="mt-2 divide-y divide-line">
      {checks(coin, now).map((k) => (
        <CheckRow key={k.id} coin={coin} check={k} elapsed={elapsed} compact />
      ))}
    </ul>
  )
}
