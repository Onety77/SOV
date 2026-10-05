import { Link } from 'react-router-dom'
import { m, type TargetAndTransition } from 'motion/react'
import { EASE_OUT } from '@/lib/motion'
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
/** How a card's live element draws itself in: false renders it at rest. */
type Draw = { delay: number } | false

export function CoinCard({ coin, stage, now, glow, preview, draw = false }: { coin: Coin; stage: Stage; now: number; glow?: boolean; preview?: boolean; draw?: Draw }) {
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
        {stage === 'curve' && <Curve coin={coin} draw={draw} />}
        {stage === 'spot' && <Blocked coin={coin} now={now} />}
        {stage === 'observation' && <Window coin={coin} now={now} draw={draw} />}
        {stage === 'perps' && <Perps coin={coin} draw={draw} />}
      </div>
    </>
  )
  const cls = cn(
    'block rounded-[14px] bg-surface p-3.5 ring-1 ring-line ring-inset transition-[box-shadow,background-color,translate,scale] duration-300 ease-out',
    !preview && 'hover-device:hover:-translate-y-0.5 hover-device:hover:bg-[#16151d] hover-device:hover:ring-line-2 hover-device:hover:shadow-[0_14px_30px_-18px_rgb(0_0_0/0.9)] active:scale-[0.985]',
    glow && 'shadow-[0_0_0_1.5px_var(--accent),0_0_40px_-6px_rgb(139_92_246/0.7)]',
  )
  // the composer's preview shares the board card's identity, so on launch it flies into place
  if (preview) return <m.div layoutId={`card-${coin.id}`} className={cls}>{body}</m.div>
  return (
    <Link to={`/markets/${coin.id}`} className={cls}>
      {body}
    </Link>
  )
}

/** Motion props for a draw-in, or none when the card renders at rest. */
const grow = (draw: Draw, from: TargetAndTransition, to: TargetAndTransition, extra = 0) =>
  draw ? { initial: from, animate: to, transition: { duration: 0.9, delay: draw.delay + extra, ease: EASE_OUT } } : { initial: false as const }

function Curve({ coin, draw }: { coin: Coin; draw: Draw }) {
  const share = curveShare(coin)
  return (
    <>
      <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-raised">
        {/* the fill draws in once; after that its width follows the live raise */}
        <m.div className="h-full origin-left" {...grow(draw, { scaleX: 0 }, { scaleX: 1 }, 0.15)}>
          <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.max(2, share * 100)}%` }} />
        </m.div>
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

function Window({ coin, now, draw }: { coin: Coin; now: number; draw: Draw }) {
  const f = windowElapsed(coin, now) / (WINDOW_H * 3_600_000)
  const r = 15
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 36 36" className="size-9 shrink-0 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--raised)" strokeWidth="3" />
        {/* the ring sweeps round to the hours held, then keeps counting */}
        <m.g {...grow(draw, { opacity: 0, rotate: -120 }, { opacity: 1, rotate: 0 }, 0.15)} style={{ transformOrigin: '18px 18px' }}>
          <circle cx="18" cy="18" r={r} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - f)} className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
        </m.g>
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

function Perps({ coin, draw }: { coin: Coin; draw: Draw }) {
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
      {/* long and short grow out from where they meet */}
      <div aria-hidden className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <m.span className="h-full origin-right rounded-l-full bg-up" style={{ width: `${p.longShare * 100}%` }} {...grow(draw, { scaleX: 0 }, { scaleX: 1 }, 0.15)} />
        <m.span className="h-full flex-1 origin-left rounded-r-full bg-down" {...grow(draw, { scaleX: 0 }, { scaleX: 1 }, 0.15)} />
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
