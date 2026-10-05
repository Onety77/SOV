import { Check, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { CheckState } from '@/lib/types'

/** A readiness check's state: green ring and tick, red ring and cross, or a violet ring still turning. */
export function CheckIcon({ state, small, className }: { state: CheckState; small?: boolean; className?: string }) {
  const icon = small ? 'size-3' : 'size-4'
  return (
    <span aria-hidden className={cn('relative grid shrink-0 place-items-center rounded-full', small ? 'size-6' : 'size-8', className)}>
      {state === 'pending' ? (
        <>
          <svg viewBox="0 0 32 32" className="spin-slow absolute inset-0">
            <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--accent)" strokeOpacity="0.25" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="22 70" strokeLinecap="round" />
          </svg>
          <span className={cn('breathe rounded-full bg-accent', small ? 'size-1' : 'size-1.5')} />
        </>
      ) : (
        <>
          <span className={cn('absolute inset-0 rounded-full ring-[1.5px] ring-inset', state === 'pass' ? 'ring-up' : 'ring-down')} />
          {state === 'pass' ? <Check className={cn(icon, 'text-up')} strokeWidth={2.5} /> : <X className={cn(icon, 'text-down')} strokeWidth={2.5} />}
        </>
      )}
    </span>
  )
}
