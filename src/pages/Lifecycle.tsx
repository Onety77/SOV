import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { EASE_OUT, EASE_UI } from '@/lib/motion'
import { CURVE_TARGET_SOL, INITIAL_LEVERAGE, MAX_DEVIATION_PCT, MIN_DEPTH_USD, ORACLE_MAX_AGE_S, WINDOW_H } from '@/lib/rules'
import { usd } from '@/lib/format'
import { useTitle } from '@/lib/useTitle'
import { Button } from '@/components/ui/Button'
import { MaskLine } from '@/components/motion/MaskLine'
import { Stages } from '@/components/lifecycle/Stages'

const matrix = [
  { market: 'Curve trading', at: [true, false, false, false] },
  { market: 'Spot on PumpSwap', at: [false, true, true, true] },
  { market: `${INITIAL_LEVERAGE}x long & short`, at: [false, false, false, true] },
]

const faq = [
  {
    q: 'Why doesn’t graduation end spot trading?',
    a: 'Spot is the market the rest is measured against. The canonical PumpSwap pool stays live through every later stage, so holders never lose a way out and perps always have a real price to follow.',
  },
  {
    q: 'What happens if a check fails during the window?',
    a: `The window stops and starts again from zero once every check holds. Perps need ${WINDOW_H} hours of unbroken readiness, not ${WINDOW_H} hours in total.`,
  },
  {
    q: 'What does coin-backed mean?',
    a: 'Margin for a perpetual position is posted in the coin itself rather than in a stablecoin. Your exposure and your collateral are the same asset, which is why leverage starts low.',
  },
  {
    q: `Will leverage ever go above ${INITIAL_LEVERAGE}x?`,
    a: `Markets open at ${INITIAL_LEVERAGE}x. Any higher limit is outside this concept preview.`,
  },
  {
    q: 'Can perps lock again after they open?',
    a: 'In this concept, yes: if the oracle goes stale or liquidity falls below the minimum, new positions pause until the checks hold again. Spot is never paused.',
  },
]

export function Lifecycle() {
  useTitle('Lifecycle')
  const [open, setOpen] = useState(0)
  const rules = [
    ['Graduation', `${CURVE_TARGET_SOL} SOL raised on the curve`],
    ['Oracle freshness', `Updated within ${ORACLE_MAX_AGE_S}s`],
    ['Price deviation', `Within ${MAX_DEVIATION_PCT}% of the pool`],
    ['Liquidity depth', `At least ${usd(MIN_DEPTH_USD)} in the canonical pool`],
    ['Observation window', `${WINDOW_H}h with every check holding`],
    ['Initial leverage', `${INITIAL_LEVERAGE.toFixed(1)}x, margin in the coin`],
  ]
  return (
    <div className="pb-24">
      <section className="wrap pt-14 sm:pt-20">
        <m.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          Lifecycle
        </m.p>
        <h1 className="mt-5 max-w-[860px] text-display">
          <MaskLine delay={0.05}>Four stages.</MaskLine>
          <MaskLine delay={0.13}>Each one adds a market.</MaskLine>
        </h1>
        <m.p className="mt-6 max-w-[580px] text-[17px] leading-relaxed text-ink-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}>
          A coin earns each market by proving the one before it. Nothing is taken away along the way: graduation keeps spot, and leverage arrives on top of it.
        </m.p>
      </section>

      <section className="wrap pt-16 sm:pt-20">
        <h2 className="sr-only">The four stages</h2>
        <Stages detail />
      </section>

      <section className="wrap pt-24">
        <h2 className="text-h1">What is open, when.</h2>
        <div className="mt-8">
          <table className="w-full table-fixed text-left text-[14px]">
            <thead>
              <tr>
                <th className="label w-[40%] pb-3 font-normal sm:w-[34%]">Market</th>
                {['Curve', 'Spot', 'Readiness', 'Perps'].map((s, i) => (
                  <th key={s} className="label pb-3 text-center font-normal">
                    <span className="text-accent-text">0{i + 1}</span>
                    <span className="max-sm:sr-only"> {s}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((r) => (
                <tr key={r.market} className="border-t border-line">
                  <td className="py-4 pr-2 font-semibold">{r.market}</td>
                  {r.at.map((on, i) => (
                    <td key={i} className="py-4 text-center">
                      <span className={cn('inline-block size-2.5 rounded-full', on ? 'bg-accent' : 'bg-raised ring-1 ring-line-2')} />
                      <span className="sr-only">{on ? 'Open' : 'Closed'}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="wrap grid gap-12 pt-24 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="text-h1">The numbers.</h2>
          <p className="mt-3 max-w-[440px] text-[15px] leading-relaxed text-ink-2">Every gate is a measurement anyone can watch, not a decision someone makes.</p>
          <dl className="mt-8 divide-y divide-line border-y border-line">
            {rules.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-6 py-4">
                <dt className="text-[14px] text-ink-2">{k}</dt>
                <dd className="text-right font-mono text-[14px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="text-h1">Questions.</h2>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {faq.map((f, i) => (
              <li key={f.q}>
                <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold">
                  {f.q}
                  <ChevronDown className={cn('size-4 shrink-0 text-ink-3 transition-transform duration-300', open === i && 'rotate-180')} />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE_UI }} className="overflow-hidden">
                      <p className="pb-5 text-[14.5px] leading-relaxed text-ink-2">{f.a}</p>
                    </m.div>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap pt-24">
        <div className="flex flex-col gap-6 border-t border-line pt-10 md:flex-row md:items-end md:justify-between">
          <h2 className="text-h1">Start at stage one.</h2>
          <Button variant="primary" size="lg" to="/launch" className="self-start md:self-auto">
            <Plus className="size-4" strokeWidth={2.5} />
            Create a launch
          </Button>
        </div>
      </section>
    </div>
  )
}
