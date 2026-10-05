import { Fragment, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, m } from 'motion/react'
import { ArrowRight, ChevronRight } from 'lucide-react'
import type { Coin, Stage } from '@/lib/types'
import { cn } from '@/lib/cn'
import { columns, order, type Gate } from '@/lib/board'
import { useNow } from '@/lib/clock'
import { clock, two } from '@/lib/format'
import { useQuotes } from '@/lib/live'
import { EASE_IN_OUT, EASE_OUT, EASE_UI, SPRING_UI } from '@/lib/motion'
import { opensAt, stageOf } from '@/lib/readiness'
import { INITIAL_LEVERAGE } from '@/lib/rules'
import { focusStage, landed, useCoins } from '@/lib/session'
import { useMedia } from '@/lib/useMedia'
import { useArrived } from '@/components/fx/warp'
import { CoinMark } from '@/components/ui/CoinMark'
import { CountUp } from '@/components/motion/CountUp'
import { CoinCard } from './CoinCard'

/**
 * The whole market as one board. Four columns, one per stage, with the gate between each
 * pair written on the boundary. Every coin sits in the column of its real stage, ordered by
 * which will move next, and moves across when it passes a gate, live.
 */
export function Board() {
  const now = useNow()
  const all = useCoins()
  const quotes = useQuotes()
  const wide = useMedia('(min-width: 1024px)')
  const arrived = useArrived()
  const scroller = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [flash, setFlash] = useState<Stage | null>(null)

  // live raise on the curve feeds progress and ordering
  const live = useMemo(() => all.map((c) => (c.raisedSol !== undefined && quotes[c.id]?.raisedSol !== undefined ? { ...c, raisedSol: quotes[c.id].raisedSol } : c)), [all, quotes])
  const just = landed.use()
  // a coin you just launched lands at the top of its column, glowing, then glides to its place
  const byStage = columns.map((col) => {
    const list = order(col.stage, live.filter((c) => stageOf(c, now) === col.stage), now)
    const mine = list.findIndex((c) => c.id === just)
    return mine > 0 ? [list[mine], ...list.slice(0, mine), ...list.slice(mine + 1)] : list
  })

  // a coin crossing a gate: compare with where every coin was last render, and pulse the
  // gate it just passed (the counter is the animation's key)
  const placement = byStage.map((l) => l.map((c) => c.id).join()).join('|')
  const [seen, setSeen] = useState(placement)
  const [pulses, setPulses] = useState([0, 0, 0])
  if (seen !== placement) {
    const before = new Map(seen.split('|').flatMap((col, i) => col.split(',').map((id) => [id, i] as const)))
    const crossed = new Set<number>()
    byStage.forEach((list, i) => list.forEach((c) => (before.get(c.id) ?? i) < i && crossed.add(i - 1)))
    setSeen(placement)
    if (crossed.size) setPulses((p) => p.map((v, i) => (crossed.has(i) ? v + 1 : v)))
  }

  // a coin you just launched: bring the curve column into view and let its card glow a while
  useEffect(() => {
    if (!just) return
    const t = window.setTimeout(() => landed.set(null), 6000)
    return () => window.clearTimeout(t)
  }, [just])

  // the command bar can ask for a stage
  const ask = focusStage.use()
  const answer = useEffectEvent((stage: Stage) => {
    goTo(columns.findIndex((c) => c.stage === stage))
    light(stage)
  })
  useEffect(() => {
    if (ask) answer(ask.stage)
  }, [ask])

  const timer = useRef(0)
  function light(stage: Stage) {
    setFlash(stage)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setFlash(null), 1400)
  }

  function goTo(i: number) {
    const top = (strip.current?.getBoundingClientRect().top ?? 0) + window.scrollY - (wide ? 64 : 56)
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' })
    const s = scroller.current
    if (s && !wide) s.scrollTo({ left: (s.children[i] as HTMLElement).offsetLeft - s.offsetLeft - parseFloat(getComputedStyle(s).paddingLeft), behavior: 'smooth' })
  }

  const onScroll = () => {
    const s = scroller.current
    if (!s || wide) return
    const w = (s.children[0] as HTMLElement).offsetWidth + 12
    setActive(Math.min(3, Math.max(0, Math.round(s.scrollLeft / w))))
  }

  const next = byStage[2][0]
  const stats: [string, number, (n: number) => string][] = [
    ['Launches', all.length, (n) => two(Math.round(n))],
    ['Graduated', all.filter((c) => c.graduatedAt).length, (n) => two(Math.round(n))],
    ['Perps live', byStage[3].length, (n) => two(Math.round(n))],
    ['Max leverage', INITIAL_LEVERAGE, (n) => `${n.toFixed(1)}x`],
  ]
  const appear = (d: number) => ({ initial: { opacity: 0, y: 12 }, animate: arrived ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }, transition: { duration: 0.7, delay: d, ease: EASE_OUT } })

  return (
    <div id="board">
      {/* ── the thesis and the pulse of the market ── */}
      <section className="wrap flex flex-col gap-6 pt-7 pb-6 sm:pt-10 lg:flex-row lg:items-end lg:justify-between lg:pt-12 lg:pb-8">
        <m.div {...appear(0)} className="min-w-0">
          <p className="eyebrow">Coin-backed perpetual markets</p>
          <h1 className="mt-3 max-w-[600px] text-h1">Spot earns the right to unlock leverage.</h1>
        </m.div>
        <m.div {...appear(0.1)} className="flex flex-col gap-4 lg:items-end">
          <dl className="flex flex-wrap gap-x-7 gap-y-3">
            {stats.map(([k, v, f], i) => (
              <div key={k}>
                <dt className="text-[12px] text-ink-3">{k}</dt>
                <dd className="mt-0.5 font-display text-[22px] leading-none font-[620] tracking-[-0.02em] [font-stretch:105%] tabular">
                  <CountUp value={v} format={f} play={arrived} delay={0.15 + i * 0.07} />
                </dd>
              </div>
            ))}
          </dl>
          {next && (
            <Link to={`/markets/${next.id}`} className="group inline-flex max-w-full items-center gap-2.5 self-start rounded-full py-1 pr-3.5 pl-1 text-[13px] ring-1 ring-line-2 ring-inset hover-device:hover:bg-hover lg:self-end">
              <CoinMark coin={next} size={24} />
              <span className="truncate text-ink-2">
                Next unlock <b className="font-semibold text-ink">{next.symbol}</b> in <span className="font-mono text-ink tabular">{clock((opensAt(next) ?? now) - now)}</span>
              </span>
              <ArrowRight className="size-3.5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </m.div>
      </section>

      {/* ── stage strip: column heads on wide screens, flow chips on phones ── */}
      <div ref={strip} className="sticky top-14 z-30 border-y border-line bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur-xl lg:top-16">
        <div className="wrap">
          {wide ? (
            <ol className={cn('relative grid', TRACKS)}>
              {columns.map((col, i) => (
                <Fragment key={col.stage}>
                  <li className="relative min-w-0">
                    <button type="button" onClick={() => light(col.stage)} className="relative flex w-full min-w-0 flex-col items-start py-4 text-left">
                      <span className="flex w-full min-w-0 items-baseline gap-2">
                        <span className="font-mono text-[11px] text-accent-text">{col.n}</span>
                        <span className={cn('truncate text-[15px] font-semibold transition-colors duration-300', flash === col.stage && 'text-accent-text')}>{col.name}</span>
                        <Count n={byStage[i].length} />
                      </span>
                      <span className="mt-1 block w-full truncate text-[12.5px] text-ink-3">{col.blurb}</span>
                    </button>
                  </li>
                  {col.gate && (
                    <li className="relative">
                      <Perforation pulse={pulses[i]} />
                      <GateButton gate={col.gate} />
                    </li>
                  )}
                </Fragment>
              ))}
            </ol>
          ) : (
            <Chips active={active} counts={byStage.map((l) => l.length)} onPick={goTo} />
          )}
        </div>
      </div>

      {/* ── the columns ── */}
      <LayoutGroup>
        <div className="wrap pt-4 pb-10 lg:pt-0">
          <div ref={scroller} onScroll={onScroll} className={cn(wide ? cn('grid', TRACKS) : 'no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6')}>
            {columns.map((col, i) => (
              <Fragment key={col.stage}>
              <section
                aria-label={`${col.name}, ${byStage[i].length} coins`}
                className={cn(
                  'relative min-w-0 transition-colors duration-700',
                  wide ? 'pt-5 pb-8' : 'w-[84vw] max-w-[380px] shrink-0 snap-start',
                  flash === col.stage && 'bg-accent-soft/40',
                )}
              >
                {!wide && <ColumnHead blurb={col.blurb} gate={col.gate} />}
                <p className="label mb-3 max-lg:mt-3">{col.order}</p>
                <ul className="grid gap-2.5">
                  <AnimatePresence initial={false} mode="popLayout">
                    {byStage[i].map((c, k) => (
                      <Card key={c.id} coin={c} stage={col.stage} now={now} col={i} row={k} arrived={arrived} glow={c.id === just || recentlyMoved(c, now)} />
                    ))}
                  </AnimatePresence>
                </ul>
                {!byStage[i].length && <p className="rounded-[14px] px-3 py-8 text-center text-[13px] text-ink-3 border border-dashed border-line-2">No coins at this stage right now.</p>}
              </section>
              {wide && col.gate && (
                <div aria-hidden className="relative">
                  <Perforation pulse={pulses[i]} long />
                </div>
              )}
              </Fragment>
            ))}
          </div>
        </div>
      </LayoutGroup>

      <footer className="wrap flex flex-col gap-2 border-t border-line py-6 text-[12px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
        <p>Interface concept only. No wallet connection, live data, audit claim or production-readiness claim. Coins shown are fictional.</p>
        <Link to="/" className="shrink-0 font-medium text-ink-2 hover-device:hover:text-ink">
          Replay the intro
        </Link>
      </footer>
    </div>
  )
}

/** columns and the gate lanes between them */
const TRACKS = 'grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)]'

/**
 * The dashed tear line a gate sits on, like the ticket's stub. When a coin passes this
 * gate, a pulse of light runs down the line.
 */
function Perforation({ pulse, long }: { pulse?: number; long?: boolean }) {
  return (
    <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 overflow-hidden">
      <span className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--line-2)_55%,transparent_0)] bg-[length:1px_7px]" />
      {pulse ? (
        <m.span
          key={pulse}
          className="absolute inset-x-0 h-28 bg-[linear-gradient(to_bottom,transparent,var(--accent-text),transparent)]"
          initial={{ top: '-30%', opacity: 1 }}
          animate={{ top: '110%', opacity: [1, 1, 0] }}
          transition={{ duration: long ? 1.6 : 0.6, delay: long ? 0.45 : 0, ease: EASE_IN_OUT }}
        />
      ) : null}
    </span>
  )
}

/** a coin that crossed into perps in the last few seconds */
const recentlyMoved = (c: Coin, now: number) => {
  const t = opensAt(c)
  return t !== undefined && now >= t && now - t < 8000
}

/**
 * A card on the board. On arrival the columns cascade left to right, the way coins flow,
 * and each card's live element draws itself in. When a coin passes a gate its card glides
 * into the next column.
 */
function Card({ coin, stage, now, col, row, arrived, glow }: { coin: Coin; stage: Stage; now: number; col: number; row: number; arrived: boolean; glow: boolean }) {
  // the draw-in delay is fixed when the card first mounts; later moves don't replay it
  const [delay] = useState(() => 0.2 + col * 0.09 + Math.min(row, 5) * 0.05)
  return (
    <m.li
      layout="position"
      layoutId={`card-${coin.id}`}
      initial={{ opacity: 0, y: 14 }}
      animate={arrived ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.65, delay: arrived ? delay : 0, ease: EASE_OUT, layout: { type: 'spring', stiffness: 170, damping: 26 } }}
    >
      <CoinCard coin={coin} stage={stage} now={now} glow={glow} draw={arrived ? { delay } : false} />
    </m.li>
  )
}

/** Phones: the stages as flow chips, like the intro's. A pill slides to the stage in view. */
function Chips({ active, counts, onPick }: { active: number; counts: number[]; onPick: (i: number) => void }) {
  const row = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = row.current?.querySelectorAll('button')[active]
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [active])
  return (
    <div ref={row} role="tablist" aria-label="Stages" className="no-scrollbar -mx-4 flex items-center gap-0.5 overflow-x-auto px-3 py-2 sm:-mx-6 sm:px-5">
      {columns.map((col, i) => (
        <Fragment key={col.stage}>
          <button
            type="button"
            role="tab"
            aria-selected={active === i}
            onClick={() => onPick(i)}
            className={cn('relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold transition-colors duration-300', active === i ? 'text-ink' : 'text-ink-3')}
          >
            {active === i && <m.span layoutId="chip-on" className="absolute inset-0 rounded-full bg-raised ring-1 ring-accent/45 ring-inset" transition={SPRING_UI} />}
            <span className="relative">{col.short}</span>
            <span className={cn('relative font-mono text-[11px] font-normal transition-colors duration-300', active === i ? 'text-accent-text' : 'text-ink-3')}>
              <Count n={counts[i]} bare />
            </span>
          </button>
          {i < columns.length - 1 && <ChevronRight aria-hidden className="size-3 shrink-0 text-ink-4" />}
        </Fragment>
      ))}
    </div>
  )
}

/** A count that rolls when it changes: a coin arrived in or left a column. */
function Count({ n, bare }: { n: number; bare?: boolean }) {
  return (
    <span className={cn('relative inline-flex overflow-hidden tabular', !bare && 'font-mono text-[11px] text-ink-3')}>
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span key={n} initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }}>
          {n}
        </m.span>
      </AnimatePresence>
    </span>
  )
}

/** Phones: under the strip, what this column is and what it takes to move on. */
function ColumnHead({ blurb, gate }: { blurb: string; gate?: Gate }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-[12px] bg-raised/50 px-3 py-2.5">
      <p className="text-[13px] text-ink-2">{blurb}</p>
      {gate && (
        <>
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-accent-text">
            To move on: {gate.label}
            <ChevronRight className={cn('size-3.5 transition-transform', open && 'rotate-90')} />
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <m.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE_UI }} className="overflow-hidden text-[12.5px] leading-relaxed text-ink-3">
                <span className="block pt-1.5">{gate.body}</span>
              </m.p>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

/** Wide screens: the gate as a pill sitting on the column boundary; it explains itself. */
function GateButton({ gate }: { gate: Gate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', off)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('pointerdown', off)
      window.removeEventListener('keydown', esc)
    }
  }, [open])
  return (
    <div ref={ref} className="absolute inset-0 grid place-items-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Gate: ${gate.title}, ${gate.label}`}
        className={cn(
          'relative flex w-6 items-center justify-center rounded-full bg-bg py-2 font-mono text-[10.5px] whitespace-nowrap ring-1 transition-colors [writing-mode:vertical-rl]',
          open ? 'text-accent-text ring-accent' : 'text-ink-2 ring-line-2 hover-device:hover:text-ink hover-device:hover:ring-ink-4',
        )}
      >
        {gate.short}
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            role="dialog"
            aria-label={gate.title}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: EASE_UI }}
            className="absolute top-full left-1/2 z-10 mt-2 w-72 -translate-x-1/2 rounded-[14px] bg-surface p-4 text-left shadow-[0_0_0_1px_var(--line-2),0_24px_60px_-20px_rgb(0_0_0/0.9)]"
          >
            <p className="label text-accent-text">Gate</p>
            <p className="mt-1 text-[15px] font-semibold">{gate.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{gate.body}</p>
            <Link to="/how" onClick={() => setOpen(false)} className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text">
              How SOV works <ArrowRight className="size-3.5" />
            </Link>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
