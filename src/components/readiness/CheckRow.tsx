import type { Coin, Check } from '@/lib/types'
import { cn } from '@/lib/cn'
import { useNowFine } from '@/lib/clock'
import { oracleAge } from '@/lib/readiness'
import { ORACLE_MAX_AGE_S, WINDOW_H } from '@/lib/rules'
import { CheckIcon } from '@/components/ui/CheckIcon'

/** The oracle's age, read in tenths of a second: its own fast clock, so nothing else re-renders. */
function OracleAge({ coin }: { coin: Coin }) {
  const now = useNowFine()
  const age = oracleAge(coin, now)
  return <span className={cn(age > ORACLE_MAX_AGE_S && 'text-down')}>{age.toFixed(1)}s</span>
}

/** One readiness check: state, what it measures, and the live reading. */
export function CheckRow({ coin, check, elapsed, compact }: { coin: Coin; check: Check; elapsed?: number; compact?: boolean }) {
  return (
    <li className={cn('flex items-center gap-4', compact ? 'py-3' : 'py-4')}>
      <CheckIcon state={check.state} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold tracking-[-0.01em]">{check.label}</p>
        <p className={cn('mt-0.5 truncate text-[13px]', check.state === 'fail' ? 'text-ink-2' : 'text-ink-3')}>{check.detail}</p>
        {check.id === 'window' && elapsed !== undefined && (
          <span aria-hidden className="mt-2 block h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-raised">
            <span className="block h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear" style={{ width: `${(elapsed / (WINDOW_H * 3_600_000)) * 100}%` }} />
          </span>
        )}
      </div>
      <span className="shrink-0 font-mono text-[15px] font-medium tabular">{check.id === 'oracle' ? <OracleAge coin={coin} /> : check.value}</span>
    </li>
  )
}
