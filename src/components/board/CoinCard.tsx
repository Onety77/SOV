import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import type { Coin, Stage } from '@/lib/types'
import { cn } from '@/lib/cn'
import { span, usd } from '@/lib/format'
import { checks, curveShare, opensAt, windowElapsed } from '@/lib/readiness'
import { CURVE_TARGET_SOL, WINDOW_H } from '@/lib/rules'
import { CoinMark } from '@/components/ui/CoinMark'
import { LiveChange, LivePrice } from '@/components/market/LivePrice'

/**
 * A coin on the board. The top row is the same in every column; the body shows the one
 * thing that matters at this stage: progress to graduation, the check that's failing, the
 * observation clock, or how perps are positioned.
 */
export function CoinCard({ coin, stage, now, glow, preview }: { coin: Coin; stage: Stage; now: number; glow?: boolean; preview?: boolean }) {
  const body = (
    <>
      <div className="flex items-center gap-2.5">
        <CoinMark coin={coin} size={30} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold tracking-[-0.01em]">{coin.name}</p>
          <p className="truncate font-mono text-[11.5px] text-ink-3">
            ${coin.symbol} · {span(now - coin.launchedAt)}
          </p>
        </div>
        {preview ? (
          <span className="font-mono text-[13px] text-ink-3">new</span>
        ) : (
          <div className="shrink-0 text-right">
            <LivePrice id={coin.id} className="font-mono text-[13.5px] font-medium" />
            <LiveChange id={coin.id} className="block text-[11.5px]" />
          </div>
        )}
      </div>
      <div className="mt-3.5">
        {stage === 'curve' && <Curve coin={coin} />}
        {stage === 'spot' && <Blocked coin={coin} now={now} />}
        {stage === 'observation' && <Window coin={coin} now={now} />}
        {stage === 'perps' && <Perps coin={coin} />}
      </div>
    </>
  )
  const cls = cn(
    'block rounded-[14px] bg-surface p-3.5 ring-1 ring-line ring-inset transition-[box-shadow,background-color] duration-500',
    !preview && 'hover-device:hover:bg-[#16151d] hover-device:hover:ring-line-2',
    glow && 'shadow-[0_0_0_1.5px_var(--accent),0_0_40px_-6px_rgb(139_92_246/0.7)]',
  )
  if (preview) return <div className={cls}>{body}</div>
  return (
    <Link to={`/markets/${coin.id}`} className={cls}>
      {body}
    </Link>
  )
}

function Curve({ coin }: { coin: Coin }) {
  const share = curveShare(coin)
  return (
    <>
      <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-raised">
        <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.max(2, share * 100)}%` }} />
      </div>
      <p className="mt-2 flex justify-between font-mono text-[12px] tabular">
        <span className="text-ink-2">
          {(coin.raisedSol ?? 0).toFixed(1)} <span className="text-ink-3">/ {CURVE_TARGET_SOL} SOL</span>
        </span>
        <span className="font-medium">{Math.round(share * 100)}%</span>
      </p>
    </>
  )
}

function Blocked({ coin, now }: { coin: Coin; now: number }) {
  const failing = checks(coin, now).filter((k) => k.state === 'fail')
  return (
    <>
      <ul className="space-y-1.5">
        {failing.map((k) => (
          <li key={k.id} className="flex items-center gap-2 text-[12.5px]">
            <span className="grid size-4 shrink-0 place-items-center rounded-full ring-[1.5px] ring-down ring-inset">
              <X className="size-2.5 text-down" strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1 truncate text-ink-2">{k.label}</span>
            <span className="font-mono text-ink tabular">{k.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 font-mono text-[11.5px] text-ink-3">
        Pool {usd(coin.liquidity ?? 0)} · Vol {usd(coin.volume24h)}
      </p>
    </>
  )
}

function Window({ coin, now }: { coin: Coin; now: number }) {
  const f = windowElapsed(coin, now) / (WINDOW_H * 3_600_000)
  const r = 15
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 36 36" className="size-9 shrink-0 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--raised)" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - f)} className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold">Perps in {span((opensAt(coin) ?? now) - now)}</p>
        <p className="font-mono text-[11.5px] text-ink-3">
          {Math.floor(f * WINDOW_H)}h of {WINDOW_H}h held
        </p>
      </div>
    </div>
  )
}

function Perps({ coin }: { coin: Coin }) {
  const p = coin.perps
  if (!p || !p.openInterest)
    return (
      <p className="flex items-center gap-2 text-[12.5px] text-ink-2">
        <span aria-hidden className="ping relative size-1.5 rounded-full bg-accent" />
        Just opened. First positions arriving.
      </p>
    )
  return (
    <>
      <div aria-hidden className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <span className="h-full rounded-l-full bg-up" style={{ width: `${p.longShare * 100}%` }} />
        <span className="h-full flex-1 rounded-r-full bg-down" />
      </div>
      <p className="mt-2 flex justify-between font-mono text-[11.5px] tabular">
        <span className="text-ink-2">{Math.round(p.longShare * 100)}% long</span>
        <span className="text-ink-3">
          OI {usd(p.openInterest)} · {p.fundingHourly >= 0 ? '+' : '−'}
          {Math.abs(p.fundingHourly * 100).toFixed(3)}%/h
        </span>
      </p>
    </>
  )
}
