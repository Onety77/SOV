import { Link } from 'react-router-dom'
import { Lock, LockOpen } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import type { Coin } from '@/lib/types'
import { cn } from '@/lib/cn'
import { useNow } from '@/lib/clock'
import { checks, stageOf, windowElapsed } from '@/lib/readiness'
import { INITIAL_LEVERAGE } from '@/lib/rules'
import { EASE_UI } from '@/lib/motion'
import { CoinMark } from '@/components/ui/CoinMark'
import { StageTag } from '@/components/ui/StageTag'
import { CheckRow } from './CheckRow'

/**
 * A coin's readiness console: the same four checks every graduated market exposes, live,
 * and what they add up to. Failing or warming checks keep long and short locked; spot
 * trades the whole time.
 */
export function Console({ coin, link = true, className }: { coin: Coin; link?: boolean; className?: string }) {
  const now = useNow()
  const list = checks(coin, now)
  const stage = stageOf(coin, now)
  const open = stage === 'perps'
  const failing = list.filter((c) => c.state === 'fail').length
  return (
    <div className={cn('min-w-0 rounded-card bg-surface p-4 ring-1 ring-line ring-inset sm:p-6', className)}>
      <div className="flex items-center gap-3.5">
        <CoinMark coin={coin} size={44} />
        <div className="min-w-0 flex-1">
          {link ? (
            <Link to={`/markets/${coin.id}`} className="font-display text-[20px] font-[640] tracking-[-0.02em] [font-stretch:110%] hover-device:hover:text-accent-text">
              {coin.symbol} / USD
            </Link>
          ) : (
            <p className="font-display text-[20px] font-[640] tracking-[-0.02em] [font-stretch:110%]">{coin.symbol} / USD</p>
          )}
          <p className="text-[13px] text-ink-3">{coin.name}</p>
        </div>
        <StageTag stage={stage} />
      </div>
      <ul className="mt-3 divide-y divide-line border-t border-line">
        {list.map((c) => (
          <CheckRow key={c.id} coin={coin} check={c} elapsed={windowElapsed(coin, now)} />
        ))}
      </ul>
      <div
        className={cn(
          'mt-2 flex min-h-12 items-center justify-center gap-2.5 overflow-hidden rounded-[11px] px-3 py-2 text-center font-mono text-[11px] font-medium tracking-[0.08em] uppercase transition-colors duration-500 sm:text-[12px] sm:tracking-[0.12em]',
          open ? 'bg-accent-soft text-accent-text' : 'bg-raised text-ink-2',
        )}
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span key={String(open)} className="flex items-center gap-2" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ duration: 0.4, ease: EASE_UI }}>
            {open ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
            {open ? `Long & short open · ${INITIAL_LEVERAGE}x` : failing ? `Long & short locked · ${failing} failing` : 'Long & short remain locked'}
          </m.span>
        </AnimatePresence>
      </div>
    </div>
  )
}
