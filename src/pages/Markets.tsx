import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { ArrowRight, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useNow } from '@/lib/clock'
import { clock, two } from '@/lib/format'
import { EASE_OUT, EASE_UI } from '@/lib/motion'
import { opensAt, stageOf } from '@/lib/readiness'
import { INITIAL_LEVERAGE } from '@/lib/rules'
import { useCoins } from '@/lib/session'
import { useTitle } from '@/lib/useTitle'
import { useArrived } from '@/components/fx/warp'
import { OrbitField } from '@/components/fx/OrbitField'
import { Button } from '@/components/ui/Button'
import { CoinMark } from '@/components/ui/CoinMark'
import { MaskLine } from '@/components/motion/MaskLine'
import { CountUp } from '@/components/motion/CountUp'
import { Pipeline } from '@/components/readiness/Pipeline'
import { Console } from '@/components/readiness/Console'
import { Monitor } from '@/components/market/Monitor'
import { Stages } from '@/components/lifecycle/Stages'

export function Markets() {
  useTitle('Markets')
  const arrived = useArrived()
  const now = useNow()
  const all = useCoins()
  const rise = (delay: number) => ({ initial: { opacity: 0, y: 14 }, animate: arrived ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }, transition: { duration: 0.8, delay, ease: EASE_OUT } })
  const next = all.filter((c) => stageOf(c, now) === 'observation').sort((a, b) => opensAt(a)! - opensAt(b)!)[0]

  const stats = [
    { label: 'Launches', value: all.length },
    { label: 'Graduated', value: all.filter((c) => c.graduatedAt).length },
    { label: 'Perp eligible', value: all.filter((c) => stageOf(c, now) === 'perps').length },
    { label: 'Max initial leverage', value: INITIAL_LEVERAGE, lev: true },
  ]

  return (
    <>
      {/* ── hero ── */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="grid-paper absolute inset-0 -z-10" />
        <m.div aria-hidden className="absolute -top-10 right-[-30%] -z-10 aspect-square w-[min(820px,140vw)] lg:top-1/2 lg:right-[-6%] lg:w-[760px] lg:-translate-y-1/2" initial={{ opacity: 0 }} animate={{ opacity: arrived ? 1 : 0 }} transition={{ duration: 1.6 }}>
          <OrbitField className="size-full" />
          <div className="absolute inset-[22%] rounded-full bg-[radial-gradient(closest-side,rgb(124_77_255/0.16),transparent)]" />
        </m.div>

        <div className="wrap grid gap-10 pt-12 pb-14 sm:pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-16 lg:pt-24 lg:pb-24">
          <div className="min-w-0">
            <m.p className="eyebrow" {...rise(0.05)}>
              Coin-backed perpetual markets
            </m.p>
            <h1 className="mt-5 text-display">
              <MaskLine delay={0.1} play={arrived}>
                Spot earns the right
              </MaskLine>
              <MaskLine delay={0.2} play={arrived}>
                to unlock <span className="text-accent-text">leverage.</span>
              </MaskLine>
            </h1>
            <m.p className="mt-6 max-w-[540px] text-[16px] leading-relaxed text-ink-2 sm:text-[17px]" {...rise(0.4)}>
              Launch on a bonding curve, graduate into canonical PumpSwap liquidity, then pass observable readiness gates before {INITIAL_LEVERAGE}x markets open.
            </m.p>
            <m.div className="mt-8 flex flex-wrap gap-3" {...rise(0.5)}>
              <Button variant="primary" size="lg" to="/launch">
                <Plus className="size-4" strokeWidth={2.5} />
                Create a launch
              </Button>
              <Button variant="outline" size="lg" to="/lifecycle">
                See the lifecycle
              </Button>
            </m.div>
            {next && (
              <m.div {...rise(0.62)}>
                <Link to={`/markets/${next.id}`} className="group mt-8 inline-flex max-w-full items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5 text-[13px] ring-1 ring-line-2 ring-inset hover-device:hover:bg-hover">
                  <CoinMark coin={next} size={26} />
                  <span className="truncate text-ink-2">
                    Next unlock <span className="font-semibold text-ink">{next.symbol}</span> perps in <span className="font-mono text-ink tabular">{clock(opensAt(next)! - now)}</span>
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </m.div>
            )}
          </div>
          <Pipeline play={arrived} delay={0.3} className="w-full max-w-[440px] lg:justify-self-end" />
        </div>
      </section>

      {/* ── stats ── */}
      <section aria-label="Market stats" className="wrap">
        <dl className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={cn('px-1 py-6 sm:px-6 sm:py-8', i % 2 === 1 && 'border-l border-line pl-5', i >= 2 && 'max-lg:border-t max-lg:border-line', i === 2 && 'lg:border-l lg:border-line lg:pl-6', i === 0 && 'sm:pl-1')}>
              <dt className="text-[13px] text-ink-3">{s.label}</dt>
              <dd className="mt-2 font-display text-[clamp(28px,4vw,40px)] leading-none font-[620] tracking-[-0.03em] [font-stretch:105%] tabular">
                {arrived ? <CountUp value={s.value} format={(n) => (s.lev ? `${n.toFixed(1)}x` : two(Math.round(n)))} delay={0.25 + i * 0.08} /> : <span className="opacity-0">00</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── market monitor ── */}
      <section id="monitor" className="wrap scroll-mt-20 pt-20 sm:pt-28">
        <p className="eyebrow">Market monitor</p>
        <h2 className="mt-4 max-w-[560px] text-h1">Every coin shows its actual stage.</h2>
        <Monitor className="mt-8" />
      </section>

      {/* ── lifecycle ── */}
      <section className="wrap pt-24 sm:pt-32">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">Lifecycle</p>
            <h2 className="mt-4 max-w-[600px] text-h1">Graduation does not kill spot. It adds the next layer.</h2>
          </div>
          <p className="max-w-[480px] text-[16px] leading-relaxed text-ink-2 lg:justify-self-end">
            Perpetual markets stay locked until both oracle and liquidity conditions hold for the required observation window.
          </p>
        </div>
        <Stages className="mt-12 lg:mt-16" />
      </section>

      <ReadinessSection />

      {/* ── close ── */}
      <section className="wrap pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="flex flex-col gap-6 border-t border-line pt-10 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-h1">Start on the curve.</h2>
            <p className="mt-3 max-w-[460px] text-[16px] leading-relaxed text-ink-2">Every coin begins the same way. Spot is earned by the market; leverage is earned by spot.</p>
          </div>
          <Button variant="primary" size="lg" to="/launch" className="self-start md:self-auto">
            <Plus className="size-4" strokeWidth={2.5} />
            Create a launch
          </Button>
        </div>
      </section>
    </>
  )
}

/** The console for one coin at a time; pick a coin to see a check fail, warm, or pass. */
function ReadinessSection() {
  const all = useCoins()
  const now = useNow()
  const order = ['tide', 'pebble', 'sable', 'wisp', 'moss', 'lumen']
  const options = order.map((id) => all.find((c) => c.id === id)).filter((c) => c !== undefined)
  const [id, setId] = useState('tide')
  const coin = options.find((c) => c.id === id) ?? options[0]
  return (
    <section id="readiness" className="wrap scroll-mt-20 pt-24 sm:pt-32">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <p className="eyebrow">Readiness console</p>
          <h2 className="mt-4 max-w-[480px] text-h1">No shortcut from graduation to leverage.</h2>
          <p className="mt-5 max-w-[460px] text-[16px] leading-relaxed text-ink-2">
            Each market exposes the same four checks. A failed or warming check keeps both long and short actions locked while spot trading continues.
          </p>
          <div className="mt-8">
            <p className="label">Inspect a market</p>
            <div role="radiogroup" aria-label="Market" className="mt-3 flex flex-wrap gap-2">
              {options.map((c) => {
                const s = stageOf(c, now)
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={c.id === coin.id}
                    onClick={() => setId(c.id)}
                    className={cn(
                      'flex h-9 items-center gap-2 rounded-full pr-3.5 pl-1.5 text-[13px] font-semibold transition-colors',
                      c.id === coin.id ? 'bg-ink text-bg' : 'text-ink-2 ring-1 ring-line-2 ring-inset hover-device:hover:text-ink',
                    )}
                  >
                    <CoinMark coin={c} size={24} />
                    {c.symbol}
                    <span aria-hidden className={cn('size-1.5 rounded-full', s === 'perps' ? 'bg-accent' : s === 'observation' ? 'bg-accent/50' : 'bg-down')} />
                  </button>
                )
              })}
            </div>
          </div>
          <Button variant="outline" size="lg" to={`/markets/${coin.id}`} className="mt-8">
            Inspect {coin.symbol} readiness
            <ArrowRight className="size-4" />
          </Button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={coin.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: EASE_UI }}>
            <Console coin={coin} />
          </m.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
