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
import { EASE_OUT, EASE_UI, SPRING_UI } from '@/lib/motion'
import { opensAt, stageOf } from '@/lib/readiness'
import { INITIAL_LEVERAGE } from '@/lib/rules'
import { focusStage, landed, useCoins } from '@/lib/session'
import { useMedia } from '@/lib/useMedia'
import { useArrived } from '@/components/fx/warp'
import { CoinMark } from '@/components/ui/CoinMark'
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
  const just = landed.use()
  const scroller = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [flash, setFlash] = useState<Stage | null>(null)

  // live raise on the curve feeds progress and ordering
  const live = useMemo(() => all.map((c) => (c.raisedSol !== undefined && quotes[c.id]?.raisedSol !== undefined ? { ...c, raisedSol: quotes[c.id].raisedSol } : c)), [all, quotes])
  const byStage = columns.map((col) => order(col.stage, live.filter((c) => stageOf(c, now) === col.stage), now))

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
  const stats = [
    ['Launches', two(all.length)],
    ['Graduated', two(all.filter((c) => c.graduatedAt).length)],
    ['Perps live', two(byStage[3].length)],
    ['Max leverage', `${INITIAL_LEVERAGE.toFixed(1)}x`],
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
            {stats.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12px] text-ink-3">{k}</dt>
                <dd className="mt-0.5 font-display text-[22px] leading-none font-[620] tracking-[-0.02em] [font-stretch:105%] tabular">{v}</dd>
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

      {/* ── stage strip: column heads on wide screens, a stage switcher on phones ── */}
      <div ref={strip} className="sticky top-14 z-30 border-y border-line bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur-xl lg:top-16">
        <div className="wrap">
          <ol className={cn('relative grid', wide ? TRACKS : 'grid-cols-4')}>
            {columns.map((col, i) => {
              const on = wide ? flash === col.stage : active === i
              return (
                <Fragment key={col.stage}>
                  <li className="relative min-w-0">
                    <button
                      type="button"
                      onClick={() => (wide ? light(col.stage) : goTo(i))}
                      aria-current={!wide && active === i ? 'true' : undefined}
                      className="relative flex w-full min-w-0 flex-col items-start py-2.5 text-left lg:py-4"
                    >
                      {wide ? (
                        <>
                          <span className="flex w-full min-w-0 items-baseline gap-2">
                            <span className="font-mono text-[11px] text-accent-text">{col.n}</span>
                            <span className={cn('truncate text-[15px] font-semibold transition-colors', on && 'text-accent-text')}>{col.name}</span>
                            <span className="font-mono text-[11px] text-ink-3">{byStage[i].length}</span>
                          </span>
                          <span className="mt-1 block w-full truncate text-[12.5px] text-ink-3">{col.blurb}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-[10.5px] text-ink-3">
                            <span className="text-accent-text">{col.n}</span> · {byStage[i].length}
                          </span>
                          <span className={cn('mt-0.5 block w-full truncate text-[13px] font-semibold transition-colors', !on && 'text-ink-3')}>{col.short}</span>
                          {active === i && <m.span layoutId="strip-on" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" transition={SPRING_UI} />}
                        </>
                      )}
                    </button>
                  </li>
                  {wide && col.gate && (
                    <li className="relative">
                      <Perforation />
                      <GateButton gate={col.gate} />
                    </li>
                  )}
                </Fragment>
              )
            })}
          </ol>
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
                      <Card key={c.id} coin={c} stage={col.stage} now={now} index={k} arrived={arrived} glow={c.id === just || recentlyMoved(c, now)} />
                    ))}
                  </AnimatePresence>
                </ul>
                {!byStage[i].length && <p className="rounded-[14px] px-3 py-8 text-center text-[13px] text-ink-3 border border-dashed border-line-2">No coins at this stage right now.</p>}
              </section>
              {wide && col.gate && (
                <div aria-hidden className="relative">
                  <Perforation />
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

/** the dashed tear line a gate sits on, like the ticket's stub */
function Perforation() {
  return <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[linear-gradient(to_bottom,var(--line-2)_55%,transparent_0)] bg-[length:1px_7px]" />
}

/** a coin that crossed into perps in the last few seconds */
const recentlyMoved = (c: Coin, now: number) => {
  const t = opensAt(c)
  return t !== undefined && now >= t && now - t < 8000
}

function Card({ coin, stage, now, index, arrived, glow }: { coin: Coin; stage: Stage; now: number; index: number; arrived: boolean; glow: boolean }) {
  return (
    <m.li
      layout="position"
      layoutId={`card-${coin.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={arrived ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.55, delay: arrived ? Math.min(index, 6) * 0.05 : 0, ease: EASE_OUT, layout: { duration: 0.7, ease: EASE_UI } }}
    >
      <CoinCard coin={coin} stage={stage} now={now} glow={glow} />
    </m.li>
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
