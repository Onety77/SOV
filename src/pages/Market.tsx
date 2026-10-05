import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { Coin } from '@/lib/types'
import { cn } from '@/lib/cn'
import { useNow } from '@/lib/clock'
import { count, sol, span, usd } from '@/lib/format'
import { useQuote } from '@/lib/live'
import { curveShare, stageOf } from '@/lib/readiness'
import { CURVE_TARGET_SOL } from '@/lib/rules'
import { useCoins } from '@/lib/session'
import { useMedia } from '@/lib/useMedia'
import { useTitle } from '@/lib/useTitle'
import { CoinMark } from '@/components/ui/CoinMark'
import { StageTag } from '@/components/ui/StageTag'
import { Notice } from '@/components/ui/Notice'
import { Candles } from '@/components/market/Candles'
import { LiveChange, LivePrice } from '@/components/market/LivePrice'
import { StageRail } from '@/components/market/StageRail'
import { TradePanel } from '@/components/market/TradePanel'
import { TradesList } from '@/components/market/TradesList'
import { Console } from '@/components/readiness/Console'

export function Market() {
  const { id } = useParams()
  const coin = useCoins().find((c) => c.id === id)
  useTitle(coin ? `${coin.name} ($${coin.symbol})` : 'Not found')
  if (!coin)
    return (
      <div className="wrap py-16">
        <Notice title="No market with that name." body="It may have been a typo, or a coin launched in another visit." action="Back to markets" to="/markets" />
      </div>
    )
  return <Page key={coin.id} coin={coin} />
}

function Page({ coin }: { coin: Coin }) {
  const now = useNow()
  const q = useQuote(coin.id)
  const wide = useMedia('(min-width: 1024px)')
  const stage = stageOf(coin, now)
  const curve = stage === 'curve'
  const share = curveShare({ ...coin, raisedSol: q.raisedSol })

  const figures: [string, string][] = [
    ['Market cap', usd(q.mcap)],
    curve ? ['Raised', `${(q.raisedSol ?? 0).toFixed(1)} / ${CURVE_TARGET_SOL} SOL`] : ['Spot liquidity', usd(coin.liquidity ?? 0)],
    ['24h volume', usd(coin.volume24h)],
    coin.perps && stage === 'perps' && coin.perps.openInterest ? ['Open interest', usd(coin.perps.openInterest)] : ['Holders', count(coin.holders)],
  ]

  return (
    <div className="wrap pt-6 pb-20 sm:pt-8">
      <Link to="/markets" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover-device:hover:text-ink">
        <ArrowLeft className="size-3.5" /> Markets
      </Link>

      <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <CoinMark coin={coin} size={56} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="text-h1">{coin.name}</h1>
              <StageTag stage={stage} />
            </div>
            <p className="mt-1 truncate font-mono text-[13px] text-ink-3">
              ${coin.symbol} · by {coin.creator} · {span(now - coin.launchedAt)} old
            </p>
          </div>
        </div>
        <p className="flex items-baseline gap-3 sm:flex-col sm:items-end sm:gap-1">
          <LivePrice id={coin.id} className="font-display text-[34px] leading-none font-[640] tracking-[-0.03em] [font-stretch:105%]" />
          <LiveChange id={coin.id} className="text-[14px]" />
        </p>
      </header>

      <StageRail coin={coin} now={now} className="mt-8" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <div className="min-w-0">
          <section aria-label="Price chart">
            <div className="flex items-baseline justify-between">
              <h2 className="label">Price · 1h candles</h2>
              <span className="font-mono text-[12px] text-ink-3">{curve ? 'Bonding curve' : 'PumpSwap pool'}</span>
            </div>
            <Candles seed={coin.id} base={coin.price} change={coin.change24h} live={q.price} className="mt-4 h-[240px] sm:h-[320px]" />
          </section>

          {curve && (
            <section aria-label="Bonding curve" className="mt-8 rounded-card bg-surface p-5 ring-1 ring-line ring-inset">
              <p className="flex items-baseline justify-between">
                <span className="label">Bonding curve</span>
                <span className="font-mono text-[13px] font-medium tabular">{Math.round(share * 100)}%</span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised">
                <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${share * 100}%` }} />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-3">
                {sol(q.raisedSol ?? 0)} of {CURVE_TARGET_SOL} SOL. At the threshold the coin graduates into its canonical PumpSwap pool, and spot trading carries on there.
              </p>
            </section>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-y-6 border-y border-line py-6 sm:grid-cols-4">
            {figures.map(([k, v], i) => (
              <div key={k} className={cn('min-w-0', i % 2 === 1 && 'border-l border-line pl-5', i === 2 && 'sm:border-l sm:border-line sm:pl-5')}>
                <dt className="text-[13px] text-ink-3">{k}</dt>
                <dd className="mt-1.5 truncate font-mono text-[17px] font-medium tabular">{v}</dd>
              </div>
            ))}
          </dl>

          {!wide && <TradePanel coin={coin} className="mt-8" />}

          {!curve && (
            <section id="readiness" className="mt-12 scroll-mt-24">
              <h2 className="text-h2">Readiness</h2>
              <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-ink-2">The same four checks every graduated market exposes. Long and short open only after all of them hold for the full window.</p>
              <Console coin={coin} link={false} className="mt-5" />
            </section>
          )}

          <section className="mt-12">
            <h2 className="text-h2">Recent trades</h2>
            <div className="mt-4">
              <TradesList coin={coin} now={now} />
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-h2">About</h2>
            <p className="mt-3 max-w-[600px] text-[15px] leading-relaxed text-ink-2">{coin.blurb}</p>
            <p className="mt-3 text-[12px] text-ink-3">{coin.mine ? 'Launched by you this visit.' : 'Fictional sample coin.'}</p>
          </section>
        </div>

        {wide && (
          <aside className="self-start lg:sticky lg:top-24">
            <TradePanel coin={coin} />
          </aside>
        )}
      </div>
    </div>
  )
}
