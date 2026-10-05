import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { columns } from '@/lib/board'
import { usd } from '@/lib/format'
import { stages } from '@/lib/lifecycle'
import { EASE_UI } from '@/lib/motion'
import { CURVE_TARGET_SOL, INITIAL_LEVERAGE, MAX_DEVIATION_PCT, MIN_DEPTH_USD, ORACLE_MAX_AGE_S, WINDOW_H } from '@/lib/rules'
import { useTitle } from '@/lib/useTitle'
import { Sheet } from '@/components/shell/Sheet'
import { LayerStack } from '@/components/lifecycle/LayerStack'

const faq = [
  ['Why doesn’t graduation end spot trading?', 'Spot is the market everything else is measured against. The canonical PumpSwap pool stays live through every later stage, so holders always have a way out and perps always have a real price to follow.'],
  ['What happens if a check fails during the window?', `The window resets, and the coin moves back to the Spot column until every check holds again. Perps need ${WINDOW_H} hours of unbroken readiness, not ${WINDOW_H} hours in total.`],
  ['What does coin-backed mean?', 'Margin for a perpetual position is posted in the coin itself, not in a stablecoin. Your exposure and your collateral are the same asset, which is why leverage starts low.'],
  [`Will leverage go above ${INITIAL_LEVERAGE}x?`, `Markets open at ${INITIAL_LEVERAGE}x. Any higher limit is outside this concept preview.`],
  ['Can perps lock again after they open?', 'In this concept, yes: if the oracle goes stale or liquidity falls below the minimum, new positions pause until the checks hold again. Spot is never paused.'],
]

/** The rules, in one place, opened over the board they describe. */
export function HowSheet() {
  useTitle('How SOV works')
  const navigate = useNavigate()
  const [open, setOpen] = useState(0)
  const numbers = [
    ['Graduation', `${CURVE_TARGET_SOL} SOL raised`],
    ['Oracle freshness', `Updated within ${ORACLE_MAX_AGE_S}s`],
    ['Price deviation', `Within ${MAX_DEVIATION_PCT}% of the pool`],
    ['Liquidity depth', `${usd(MIN_DEPTH_USD)} or more`],
    ['Observation', `${WINDOW_H}h, unbroken`],
    ['Initial leverage', `${INITIAL_LEVERAGE.toFixed(1)}x, margin in the coin`],
  ]
  return (
    <Sheet label="How SOV works" onClose={() => navigate('/markets')} head={<h2 className="text-[20px] leading-tight">How SOV works</h2>}>
      <p className="text-[15px] leading-relaxed text-ink-2">Four stages, left to right on the board. A coin earns each market by proving the one before it, and nothing is taken away on the way: graduation keeps spot, and leverage arrives on top of it.</p>

      <ol className="mt-8">
        {stages.map((s, i) => (
          <li key={s.n} className="grid grid-cols-[36px_1fr] gap-x-4 border-t border-line py-6">
            <span className="grid size-9 place-items-center rounded-full font-mono text-[12px] text-accent-text ring-[1.5px] ring-accent ring-inset">{s.n}</span>
            <div className="min-w-0">
              <h3 className="font-display text-[18px] font-[640] tracking-[-0.02em] [font-stretch:110%]">{s.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{s.body}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_200px] sm:items-center">
                {columns[i].gate ? (
                  <p className="text-[13px] text-ink-3">
                    To move on: <span className="font-mono text-ink">{columns[i].gate!.label}</span>
                  </p>
                ) : (
                  <p className="text-[13px] text-ink-3">The last stage. Spot carries on alongside.</p>
                )}
                <LayerStack layers={s.layers} className="lg:h-auto" />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <h3 className="mt-4 text-h2">The numbers</h3>
      <dl className="mt-4 divide-y divide-line border-y border-line">
        {numbers.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-6 py-3">
            <dt className="text-[14px] text-ink-2">{k}</dt>
            <dd className="text-right font-mono text-[13.5px] font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-10 text-h2">Questions</h3>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {faq.map(([q, a], i) => (
          <li key={q}>
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold">
              {q}
              <ChevronDown className={cn('size-4 shrink-0 text-ink-3 transition-transform duration-300', open === i && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE_UI }} className="overflow-hidden">
                  <p className="pb-5 text-[14px] leading-relaxed text-ink-2">{a}</p>
                </m.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
