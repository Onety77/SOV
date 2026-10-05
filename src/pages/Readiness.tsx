import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import type { Coin, Stage } from '@/lib/types'
import { cn } from '@/lib/cn'
import { useNow } from '@/lib/clock'
import { EASE_OUT, EASE_UI } from '@/lib/motion'
import { checks, stageOf, windowElapsed } from '@/lib/readiness'
import { MAX_DEVIATION_PCT, MIN_DEPTH_USD, ORACLE_MAX_AGE_S, WINDOW_H } from '@/lib/rules'
import { usd } from '@/lib/format'
import { useCoins } from '@/lib/session'
import { useMedia } from '@/lib/useMedia'
import { useTitle } from '@/lib/useTitle'
import { CoinMark } from '@/components/ui/CoinMark'
import { StageTag } from '@/components/ui/StageTag'
import { Tabs } from '@/components/ui/Tabs'
import { CheckIcon } from '@/components/ui/CheckIcon'
import { MaskLine } from '@/components/motion/MaskLine'
import { Console } from '@/components/readiness/Console'

type Filter = 'all' | 'blocked' | 'observation' | 'perps'
const match = (s: Stage, f: Filter) => f === 'all' || (f === 'blocked' ? s === 'spot' : s === f)

export function Readiness() {
  useTitle('Readiness')
  const now = useNow()
  const wide = useMedia('(min-width: 900px)')
  const graduated = useCoins().filter((c) => c.graduatedAt)
  const [filter, setFilter] = useState<Filter>('all')
  const order: Record<Stage, number> = { observation: 0, spot: 1, perps: 2, curve: 3 }
  const list = graduated.filter((c) => match(stageOf(c, now), filter)).sort((a, b) => order[stageOf(a, now)] - order[stageOf(b, now)] || b.volume24h - a.volume24h)
  const count = (f: Filter) => graduated.filter((c) => match(stageOf(c, now), f)).length

  const thresholds = [
    ['Canonical pool', 'PumpSwap pool exists'],
    ['Oracle', `< ${ORACLE_MAX_AGE_S}s old, ±${MAX_DEVIATION_PCT}%`],
    ['Depth', `≥ ${usd(MIN_DEPTH_USD)}`],
    ['Window', `${WINDOW_H}h unbroken`],
  ]

  return (
    <div className="pb-24">
      <section className="wrap pt-14 sm:pt-20">
        <m.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          Readiness
        </m.p>
        <h1 className="mt-5 max-w-[900px] text-display">
          <MaskLine delay={0.05}>Four checks.</MaskLine>
          <MaskLine delay={0.13}>Live, for every market.</MaskLine>
        </h1>
        <m.dl className="mt-10 grid grid-cols-2 gap-y-6 border-y border-line py-6 md:grid-cols-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}>
          {thresholds.map(([k, v], i) => (
            <div key={k} className={cn(i % 2 === 1 && 'border-l border-line pl-5', i === 2 && 'md:border-l md:border-line md:pl-5')}>
              <dt className="text-[13px] text-ink-3">{k}</dt>
              <dd className="mt-1.5 font-mono text-[15px] font-medium">{v}</dd>
            </div>
          ))}
        </m.dl>
      </section>

      <section className="wrap pt-12">
        <Tabs
          label="Filter"
          value={filter}
          onChange={setFilter}
          className="max-w-[520px]"
          items={[
            { id: 'all', label: 'All', count: count('all') },
            { id: 'observation', label: 'Observing', count: count('observation') },
            { id: 'blocked', label: 'Blocked', count: count('blocked') },
            { id: 'perps', label: 'Perps', count: count('perps') },
          ]}
        />
        {wide ? (
          <div className="mt-6">
            <div aria-hidden className="grid grid-cols-[minmax(170px,1.3fr)_repeat(4,minmax(0,1fr))_130px] gap-4 border-b border-line px-3 pb-2.5">
              {['Market', 'Pool', 'Oracle', 'Depth', 'Window', 'Status'].map((h) => (
                <span key={h} className="label">
                  {h}
                </span>
              ))}
            </div>
            <ul>
              <AnimatePresence initial={false} mode="popLayout">
                {list.map((c) => (
                  <m.li key={c.id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.3, ease: EASE_UI }}>
                    <Row coin={c} now={now} />
                  </m.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4">
            {list.map((c) => (
              <li key={c.id}>
                <Console coin={c} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Row({ coin: c, now }: { coin: Coin; now: number }) {
  const list = checks(c, now)
  const elapsed = windowElapsed(c, now)
  return (
    <Link to={`/markets/${c.id}#readiness`} className="grid grid-cols-[minmax(170px,1.3fr)_repeat(4,minmax(0,1fr))_130px] items-center gap-4 rounded-[12px] border-b border-line px-3 py-4 transition-colors hover-device:hover:bg-hover">
      <span className="flex min-w-0 items-center gap-3">
        <CoinMark coin={c} size={34} />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold">{c.symbol} / USD</span>
          <span className="block truncate text-[12px] text-ink-3">{c.name}</span>
        </span>
      </span>
      {list.map((k) => (
        <span key={k.id} className="flex min-w-0 items-center gap-2.5">
          <CheckIcon state={k.state} small />
          <span className="min-w-0">
            <span className="block truncate font-mono text-[13px] font-medium tabular">{k.value}</span>
            {k.id === 'window' && (
              <span aria-hidden className="mt-1 block h-0.5 w-full max-w-[90px] overflow-hidden rounded-full bg-raised">
                <span className="block h-full bg-accent" style={{ width: `${(elapsed / (WINDOW_H * 3_600_000)) * 100}%` }} />
              </span>
            )}
          </span>
        </span>
      ))}
      <StageTag stage={stageOf(c, now)} />
    </Link>
  )
}
