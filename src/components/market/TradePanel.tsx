import { useState } from 'react'
import { m } from 'motion/react'
import { Lock } from 'lucide-react'
import type { Coin } from '@/lib/types'
import { cn } from '@/lib/cn'
import { SPRING_UI } from '@/lib/motion'
import { clock, count, price, sol, usd } from '@/lib/format'
import { useNow } from '@/lib/clock'
import { useQuote } from '@/lib/live'
import { checks, opensAt, stageOf } from '@/lib/readiness'
import { INITIAL_LEVERAGE, SOL_USD, TRADE_FEE_PCT } from '@/lib/rules'
import { toggleWallet, wallet } from '@/lib/session'
import { Button } from '@/components/ui/Button'
import { CheckIcon } from '@/components/ui/CheckIcon'
import { Done } from '@/components/motion/Done'

type Market = 'spot' | 'perps'

/** Two-way toggle with a sliding pill. */
function Toggle<T extends string>({ id, items, value, onChange, label, tone }: { id: string; items: { id: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void; label: string; tone?: (v: T) => string }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-[11px] bg-bg p-1" role="tablist" aria-label={label}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={cn('relative flex h-9 items-center justify-center gap-1.5 rounded-[8px] text-[14px] font-semibold transition-colors', value === it.id ? (tone?.(it.id) ?? 'text-ink') : 'text-ink-3 hover-device:hover:text-ink')}
        >
          {value === it.id && <m.span layoutId={`${id}-pill`} className="absolute inset-0 rounded-[8px] bg-raised" transition={SPRING_UI} />}
          <span className="relative flex items-center gap-1.5">{it.label}</span>
        </button>
      ))}
    </div>
  )
}

/** Trade the coin: spot always, perps once readiness has passed. Nothing is sent anywhere. */
export function TradePanel({ coin, className }: { coin: Coin; className?: string }) {
  const now = useNow()
  const stage = stageOf(coin, now)
  const [market, setMarket] = useState<Market>('spot')
  return (
    <div id="trade" className={cn('rounded-card bg-surface p-4 ring-1 ring-line ring-inset sm:p-5', className)}>
      <Toggle
        id={`mkt-${coin.id}`}
        label="Market"
        value={market}
        onChange={setMarket}
        items={[
          { id: 'spot', label: stage === 'curve' ? 'Curve' : 'Spot' },
          {
            id: 'perps',
            label: (
              <>
                {stage !== 'perps' && <Lock className="size-3.5" />}
                Perps {INITIAL_LEVERAGE}x
              </>
            ),
          },
        ]}
      />
      {market === 'spot' ? <Spot coin={coin} curve={stage === 'curve'} /> : stage === 'perps' ? <Perps coin={coin} /> : <Locked coin={coin} now={now} />}
    </div>
  )
}

function Spot({ coin, curve }: { coin: Coin; curve: boolean }) {
  const address = wallet.use()
  const q = useQuote(coin.id)
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [state, setState] = useState<'idle' | 'pending' | 'done'>('idle')
  const n = Number(amount) || 0
  const perSol = SOL_USD / q.price
  const out = side === 'buy' ? n * perSol * (1 - TRADE_FEE_PCT / 100) : (n / perSol) * (1 - TRADE_FEE_PCT / 100)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return toggleWallet()
    if (!n) return
    setState('pending')
    window.setTimeout(() => {
      setState('done')
      setAmount('')
    }, 1100)
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <Toggle
        id={`side-${coin.id}`}
        label="Side"
        value={side}
        onChange={(v) => {
          setSide(v)
          setState('idle')
        }}
        tone={(v) => (v === 'buy' ? 'text-up' : 'text-down')}
        items={[
          { id: 'buy', label: 'Buy' },
          { id: 'sell', label: 'Sell' },
        ]}
      />
      <label className="mt-4 block">
        <span className="label">{side === 'buy' ? 'You pay' : 'You sell'}</span>
        <span className="mt-2 flex h-14 items-center rounded-[11px] bg-raised px-3.5 ring-1 ring-transparent focus-within:ring-accent">
          <input
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.]/g, ''))
              setState('idle')
            }}
            className="min-w-0 flex-1 bg-transparent font-mono text-[20px] outline-none"
          />
          <span className="font-mono text-[13px] text-ink-3">{side === 'buy' ? 'SOL' : coin.symbol}</span>
        </span>
      </label>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {(side === 'buy' ? ['0.1', '0.5', '1', '5'] : ['25%', '50%', '75%', '100%']).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(side === 'buy' ? v : String(Math.round((parseInt(v) / 100) * 1_850_000)))}
            className="h-8 rounded-[8px] bg-raised font-mono text-[12px] text-ink-2 hover-device:hover:text-ink"
          >
            {v}
          </button>
        ))}
      </div>
      <p className="mt-4 flex justify-between text-[13px]">
        <span className="text-ink-3">You get about</span>
        <span className="font-mono tabular">{n ? (side === 'buy' ? `${count(out)} ${coin.symbol}` : sol(out, 3)) : '—'}</span>
      </p>
      <Button type="submit" variant={!address ? 'primary' : side} size="lg" className="mt-4 w-full disabled:opacity-100" disabled={state === 'pending' || (Boolean(address) && !n)}>
        {!address ? 'Connect wallet' : state === 'pending' ? 'Confirm in wallet…' : `${side === 'buy' ? 'Buy' : 'Sell'} $${coin.symbol}`}
      </Button>
      <p className="mt-3 text-[12px] leading-relaxed text-ink-3" aria-live="polite">
        {state === 'done' ? <Done>Trade confirmed.</Done> : `${curve ? 'Against the bonding curve' : 'On the canonical PumpSwap pool'}. ${TRADE_FEE_PCT}% fee.`}
      </p>
    </form>
  )
}

function Locked({ coin, now }: { coin: Coin; now: number }) {
  const stage = stageOf(coin, now)
  const list = stage === 'curve' ? [] : checks(coin, now)
  return (
    <div className="mt-4">
      <div className="rounded-[12px] bg-raised p-4">
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          <Lock className="size-4 text-accent-text" />
          Long & short are locked
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
          {stage === 'curve'
            ? 'Perps come after graduation to spot and a full readiness window. This coin is still on its bonding curve.'
            : stage === 'observation'
              ? `Every check holds. If they keep holding, perps open in ${clock(opensAt(coin)! - now)}.`
              : 'A check is failing, so the observation window has not started. Spot keeps trading.'}
        </p>
      </div>
      {list.length > 0 && (
        <ul className="mt-3 space-y-1">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-1.5">
              <CheckIcon state={c.state} small />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{c.label}</span>
              <span className="font-mono text-[12px] text-ink-2 tabular">{c.value}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" size="lg" disabled className="disabled:opacity-50">
          Long
        </Button>
        <Button variant="secondary" size="lg" disabled className="disabled:opacity-50">
          Short
        </Button>
      </div>
    </div>
  )
}

function Perps({ coin }: { coin: Coin }) {
  const address = wallet.use()
  const q = useQuote(coin.id)
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [margin, setMargin] = useState('')
  const [lev, setLev] = useState(INITIAL_LEVERAGE)
  const [state, setState] = useState<'idle' | 'pending' | 'done'>('idle')
  const n = Number(margin) || 0
  const size = n * q.price * lev
  const liq = side === 'long' ? q.price * (1 - (1 / lev) * 0.9) : q.price * (1 + (1 / lev) * 0.9)
  const p = coin.perps!

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return toggleWallet()
    if (!n) return
    setState('pending')
    window.setTimeout(() => {
      setState('done')
      setMargin('')
    }, 1100)
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <Toggle
        id={`dir-${coin.id}`}
        label="Direction"
        value={side}
        onChange={(v) => {
          setSide(v)
          setState('idle')
        }}
        tone={(v) => (v === 'long' ? 'text-up' : 'text-down')}
        items={[
          { id: 'long', label: 'Long' },
          { id: 'short', label: 'Short' },
        ]}
      />
      <label className="mt-4 block">
        <span className="label">Margin, in {coin.symbol}</span>
        <span className="mt-2 flex h-14 items-center rounded-[11px] bg-raised px-3.5 ring-1 ring-transparent focus-within:ring-accent">
          <input
            name="margin"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={margin}
            onChange={(e) => {
              setMargin(e.target.value.replace(/[^\d.]/g, ''))
              setState('idle')
            }}
            className="min-w-0 flex-1 bg-transparent font-mono text-[20px] outline-none"
          />
          <span className="font-mono text-[13px] text-ink-3">{coin.symbol}</span>
        </span>
      </label>
      <label className="mt-4 block">
        <span className="flex items-baseline justify-between">
          <span className="label">Leverage</span>
          <span className="font-mono text-[14px] font-medium tabular">{lev.toFixed(1)}x</span>
        </span>
        <input
          type="range"
          min={1}
          max={INITIAL_LEVERAGE}
          step={0.1}
          value={lev}
          onChange={(e) => setLev(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--accent-strong)]"
          aria-valuetext={`${lev.toFixed(1)}x`}
        />
        <span className="mt-1 flex justify-between font-mono text-[11px] text-ink-3">
          <span>1.0x</span>
          <span>{INITIAL_LEVERAGE.toFixed(1)}x max</span>
        </span>
      </label>
      <dl className="mt-4 space-y-2 text-[13px]">
        {[
          ['Position size', n ? usd(size) : '—'],
          ['Entry', price(q.price)],
          ['Est. liquidation', n ? price(liq) : '—'],
          ['Funding, 1h', `${p.fundingHourly >= 0 ? '+' : '−'}${Math.abs(p.fundingHourly * 100).toFixed(3)}%`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <dt className="text-ink-3">{k}</dt>
            <dd className="font-mono tabular">{v}</dd>
          </div>
        ))}
      </dl>
      <Button type="submit" variant={!address ? 'primary' : side === 'long' ? 'buy' : 'sell'} size="lg" className="mt-4 w-full disabled:opacity-100" disabled={state === 'pending' || (Boolean(address) && !n)}>
        {!address ? 'Connect wallet' : state === 'pending' ? 'Confirm in wallet…' : `${side === 'long' ? 'Long' : 'Short'} $${coin.symbol} ${lev.toFixed(1)}x`}
      </Button>
      <p className="mt-3 text-[12px] leading-relaxed text-ink-3" aria-live="polite">
        {state === 'done' ? <Done>Position opened.</Done> : 'Coin-backed: margin is posted in the coin itself. Spot keeps trading alongside.'}
      </p>
    </form>
  )
}
