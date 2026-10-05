import { useNavigate, useParams } from 'react-router-dom'
import type { Coin } from '@/lib/types'
import { cn } from '@/lib/cn'
import { useNow } from '@/lib/clock'
import { count, usd } from '@/lib/format'
import { useQuote } from '@/lib/live'
import { stageOf } from '@/lib/readiness'
import { CURVE_TARGET_SOL } from '@/lib/rules'
import { useCoins } from '@/lib/session'
import { useTitle } from '@/lib/useTitle'
import { Sheet } from '@/components/shell/Sheet'
import { CoinMark } from '@/components/ui/CoinMark'
import { StageTag } from '@/components/ui/StageTag'
import { Button } from '@/components/ui/Button'
import { Candles } from '@/components/market/Candles'
import { LiveChange, LivePrice } from '@/components/market/LivePrice'
import { TradePanel } from '@/components/market/TradePanel'
import { TradesList } from '@/components/market/TradesList'
import { Journey } from '@/components/coin/Journey'

/** A coin, opened over the board: price, the trade ticket, its journey, and its tape. */
export function CoinSheet() {
  const { id } = useParams()
  const navigate = useNavigate()
  const coin = useCoins().find((c) => c.id === id)
  useTitle(coin ? `${coin.name} ($${coin.symbol})` : 'Not found')
  const close = () => navigate('/markets')
  if (!coin)
    return (
      <Sheet label="Not found" onClose={close} head={<p className="text-[15px] font-semibold">Not found</p>}>
        <h2 className="mt-4 text-h2">No market with that name.</h2>
        <p className="mt-2 text-[14px] text-ink-2">It may be a typo, or a coin launched in another visit.</p>
        <Button variant="primary" className="mt-6" onClick={close}>
          Back to the board
        </Button>
      </Sheet>
    )
  return <Body key={coin.id} coin={coin} onClose={close} />
}

function Body({ coin, onClose }: { coin: Coin; onClose: () => void }) {
  const now = useNow()
  const q = useQuote(coin.id)
  const stage = stageOf(coin, now)
  const figures: [string, string][] = [
    ['Market cap', usd(q.mcap)],
    stage === 'curve' ? ['Raised', `${(q.raisedSol ?? 0).toFixed(1)} / ${CURVE_TARGET_SOL}`] : ['Pool', usd(coin.liquidity ?? 0)],
    ['24h volume', usd(coin.volume24h)],
    ['Holders', count(coin.holders)],
  ]
  return (
    <Sheet
      label={`${coin.name}, $${coin.symbol}`}
      onClose={onClose}
      head={
        <div className="flex min-w-0 items-center gap-3">
          <CoinMark coin={coin} size={40} />
          <div className="min-w-0">
            <h2 className="flex min-w-0 items-center gap-2.5 text-[20px] leading-tight">
              <span className="truncate">{coin.name}</span>
              <StageTag stage={stage} className="max-[360px]:hidden" />
            </h2>
            <p className="truncate font-mono text-[12px] text-ink-3">
              ${coin.symbol} · by {coin.creator}
            </p>
          </div>
        </div>
      }
    >
      <p className="flex items-baseline gap-3">
        <LivePrice id={coin.id} className="font-display text-[34px] leading-none font-[640] tracking-[-0.03em] [font-stretch:105%]" />
        <LiveChange id={coin.id} className="text-[14px]" />
      </p>
      <dl className="mt-5 grid grid-cols-4 gap-3">
        {figures.map(([k, v], i) => (
          <div key={k} className={cn('min-w-0', i > 0 && 'border-l border-line pl-3')}>
            <dt className="truncate text-[11.5px] text-ink-3">{k}</dt>
            <dd className="mt-1 truncate font-mono text-[13.5px] font-medium tabular">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-label="Price chart" className="mt-6">
        <p className="flex justify-between">
          <span className="label">Price · 1h candles</span>
          <span className="font-mono text-[11px] text-ink-3">{stage === 'curve' ? 'Bonding curve' : 'PumpSwap pool'}</span>
        </p>
        <Candles seed={coin.id} base={coin.price} change={coin.change24h} live={q.price} className="mt-3 h-[190px]" />
      </section>

      <section aria-label="Trade" className="mt-6 border-t border-line pt-6">
        <TradePanel coin={coin} flat />
      </section>

      <section className="mt-8">
        <h3 className="label">Journey</h3>
        <Journey coin={coin} now={now} className="mt-4" />
      </section>

      <section className="mt-8">
        <h3 className="label">Recent trades</h3>
        <div className="mt-3">
          <TradesList coin={coin} now={now} />
        </div>
      </section>

      <section className="mt-8">
        <h3 className="label">About</h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{coin.blurb}</p>
        <p className="mt-2 text-[12px] text-ink-3">{coin.mine ? 'Launched by you this visit.' : 'Fictional sample coin.'}</p>
      </section>
    </Sheet>
  )
}
