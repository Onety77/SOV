import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { ArrowRight, ArrowUpDown } from 'lucide-react'
import type { Coin, Stage } from '@/lib/types'
import { cn } from '@/lib/cn'
import { usd } from '@/lib/format'
import { useNow } from '@/lib/clock'
import { useQuotes } from '@/lib/live'
import { spark } from '@/lib/market'
import { curveShare, nextStep, stageOf } from '@/lib/readiness'
import { useCoins } from '@/lib/session'
import { useMedia } from '@/lib/useMedia'
import { EASE_UI } from '@/lib/motion'
import { Tabs } from '@/components/ui/Tabs'
import { CoinMark } from '@/components/ui/CoinMark'
import { StageTag } from '@/components/ui/StageTag'
import { Sparkline } from '@/components/ui/Sparkline'
import { LiveChange, LivePrice } from './LivePrice'

type Filter = 'all' | 'curve' | 'spot' | 'perps'
type Sort = 'volume' | 'mcap' | 'new'

const inFilter = (s: Stage, f: Filter) => f === 'all' || (f === 'curve' ? s === 'curve' : f === 'perps' ? s === 'perps' : s === 'spot' || s === 'observation')
const sorts: { id: Sort; label: string }[] = [
  { id: 'volume', label: '24h volume' },
  { id: 'mcap', label: 'Market cap' },
  { id: 'new', label: 'Newest' },
]

/** Every coin and the stage it is actually in, filterable by stage. */
export function Monitor({ initial = 'all', limit, className }: { initial?: Filter; limit?: number; className?: string }) {
  const all = useCoins()
  const now = useNow()
  const quotes = useQuotes()
  const wide = useMedia('(min-width: 1024px)')
  const [filter, setFilter] = useState<Filter>(initial)
  const [sort, setSort] = useState<Sort>('volume')
  const [more, setMore] = useState(false)
  const stages = useMemo(() => new Map(all.map((c) => [c.id, stageOf(c, now)])), [all, now])
  const counts = (f: Filter) => all.filter((c) => inFilter(stages.get(c.id)!, f)).length
  const list = all
    .filter((c) => inFilter(stages.get(c.id)!, filter))
    .sort((a, b) => (sort === 'new' ? b.launchedAt - a.launchedAt : sort === 'mcap' ? quotes[b.id].mcap - quotes[a.id].mcap : b.volume24h - a.volume24h))
    .slice(0, limit)
  const shown = wide || more ? list : list.slice(0, 6)

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          label="Filter by stage"
          value={filter}
          onChange={setFilter}
          className="sm:w-[420px]"
          items={[
            { id: 'all', label: 'All', count: counts('all') },
            { id: 'curve', label: 'Curve', count: counts('curve') },
            { id: 'spot', label: 'Spot', count: counts('spot') },
            { id: 'perps', label: 'Perps', count: counts('perps') },
          ]}
        />
        <label className="flex items-center gap-2 self-end text-[13px] text-ink-3 sm:self-auto">
          <ArrowUpDown className="size-3.5" />
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 cursor-pointer rounded-control bg-transparent pr-1 font-medium text-ink-2 outline-none hover-device:hover:text-ink">
            {sorts.map((s) => (
              <option key={s.id} value={s.id} className="bg-surface">
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {wide ? (
        <div className="mt-5">
          <div aria-hidden className="grid grid-cols-[minmax(180px,1.4fr)_150px_1fr_70px_1fr_1.1fr_1fr_110px_28px] items-center gap-4 border-b border-line px-3 pb-2.5">
            {['Coin', 'Stage', 'Price', '24h', 'Mkt cap', 'Liquidity', 'Volume', 'Trend', ''].map((h, i) => (
              <span key={i} className={cn('label', i >= 2 && i <= 6 && 'text-right')}>
                {h}
              </span>
            ))}
          </div>
          <ul>
            <AnimatePresence initial={false} mode="popLayout">
              {list.map((c) => (
                <m.li key={c.id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.3, ease: EASE_UI }}>
                  <Row coin={c} stage={stages.get(c.id)!} now={now} mcap={quotes[c.id].mcap} />
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((c) => (
              <m.li key={c.id} layout="position" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }} transition={{ duration: 0.3, ease: EASE_UI }}>
                <Card coin={c} stage={stages.get(c.id)!} now={now} mcap={quotes[c.id].mcap} />
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {!wide && list.length > shown.length && (
        <button type="button" onClick={() => setMore(true)} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-card text-[14px] font-semibold text-ink-2 ring-1 ring-line-2 ring-inset hover-device:hover:text-ink">
          Show all {list.length} coins
        </button>
      )}
      {!list.length && <p className="py-10 text-center text-[14px] text-ink-3">No coins at this stage right now.</p>}
    </div>
  )
}

function Liquidity({ coin, stage }: { coin: Coin; stage: Stage }) {
  if (stage !== 'curve') return <>{usd(coin.liquidity ?? 0)}</>
  const s = curveShare(coin)
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="h-1 w-14 overflow-hidden rounded-full bg-raised">
        <span className="block h-full rounded-full bg-ink-2" style={{ width: `${s * 100}%` }} />
      </span>
      <span>{Math.round(s * 100)}%</span>
    </span>
  )
}

function Row({ coin: c, stage, now, mcap }: { coin: Coin; stage: Stage; now: number; mcap: number }) {
  return (
    <Link
      to={`/markets/${c.id}`}
      className="group grid grid-cols-[minmax(180px,1.4fr)_150px_1fr_70px_1fr_1.1fr_1fr_110px_28px] items-center gap-4 rounded-[12px] border-b border-line px-3 py-3.5 transition-colors hover-device:hover:bg-hover"
    >
      <span className="flex min-w-0 items-center gap-3">
        <CoinMark coin={c} size={34} />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold">{c.name}</span>
          <span className="block truncate font-mono text-[12px] text-ink-3">${c.symbol}</span>
        </span>
      </span>
      <span className="min-w-0">
        <StageTag stage={stage} />
        <span className="mt-1 block truncate text-[12px] text-ink-3">{nextStep(c, now)}</span>
      </span>
      <LivePrice id={c.id} className="justify-self-end font-mono text-[14px] font-medium" />
      <LiveChange id={c.id} className="text-right text-[13px]" />
      <span className="text-right font-mono text-[14px] tabular">{usd(mcap)}</span>
      <span className="text-right font-mono text-[14px] text-ink-2 tabular">
        <Liquidity coin={c} stage={stage} />
      </span>
      <span className="text-right font-mono text-[14px] text-ink-2 tabular">{usd(c.volume24h)}</span>
      <Sparkline data={spark(c)} className="h-7" />
      <ArrowRight aria-hidden className="size-4 text-ink-4 transition-[color,translate] group-hover:translate-x-0.5 group-hover:text-ink-2" />
    </Link>
  )
}

function Card({ coin: c, stage, now, mcap }: { coin: Coin; stage: Stage; now: number; mcap: number }) {
  const figures: [string, React.ReactNode][] = [
    ['Market cap', usd(mcap)],
    stage === 'curve' ? ['Curve', <Liquidity key="l" coin={c} stage={stage} />] : ['Spot liquidity', usd(c.liquidity ?? 0)],
    ['24h volume', usd(c.volume24h)],
  ]
  return (
    <Link to={`/markets/${c.id}`} className="block rounded-card bg-surface p-5 ring-1 ring-line ring-inset transition-colors active:bg-raised hover-device:hover:ring-line-2">
      <div className="flex items-start gap-3">
        <CoinMark coin={c} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold tracking-[-0.01em]">{c.name.toUpperCase()}</p>
          <p className="font-mono text-[12px] text-ink-3">${c.symbol}</p>
        </div>
        <StageTag stage={stage} />
      </div>
      <p className="mt-5 flex items-baseline gap-2.5">
        <LivePrice id={c.id} className="font-display text-[28px] font-[640] tracking-[-0.02em] [font-stretch:105%]" />
        <LiveChange id={c.id} className="text-[13px]" />
      </p>
      <Sparkline data={spark(c)} className="mt-3 h-9 w-2/3" />
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {figures.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="truncate text-[12px] text-ink-3">{k}</dt>
            <dd className="mt-1 truncate font-mono text-[14px] font-medium tabular">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5 text-[13px]">
        <span className="truncate text-ink-3">{nextStep(c, now)}</span>
        <span className="flex shrink-0 items-center gap-1 font-semibold text-ink">
          View {stage === 'curve' ? 'curve' : 'status'} <ArrowRight className="size-3.5" />
        </span>
      </p>
    </Link>
  )
}
