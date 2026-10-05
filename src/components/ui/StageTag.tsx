import { cn } from '@/lib/cn'
import type { Stage } from '@/lib/types'

const text: Record<Stage, string> = { curve: 'On curve', spot: 'Spot live', observation: 'Observation', perps: 'Perps live' }

/** The stage a coin is in, as a quiet chip. Violet only once leverage is near or open. */
export function StageTag({ stage, className }: { stage: Stage; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 rounded-[6px] bg-raised px-2 font-mono text-[10.5px] font-medium tracking-[0.08em] text-ink-2 uppercase', className)}>
      <span
        aria-hidden
        className={cn(
          'relative size-1.5 rounded-full',
          stage === 'curve' && 'bg-ink-3',
          stage === 'spot' && 'bg-ink-2',
          stage === 'observation' && 'breathe bg-accent',
          stage === 'perps' && 'ping bg-accent',
        )}
      />
      {text[stage]}
    </span>
  )
}
