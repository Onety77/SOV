import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

/** Empty and error states: a calm message and the next action. No box. */
export function Notice({ kind = 'empty', title, body, action, onAction, to, children, className }: { kind?: 'empty' | 'error'; title: string; body?: string; action?: string; onAction?: () => void; to?: string; children?: ReactNode; className?: string }) {
  return (
    <div role={kind === 'error' ? 'alert' : undefined} className={cn('flex flex-col items-start py-10', className)}>
      <p className={cn('font-display text-[20px] font-[640] tracking-[-0.02em]', kind === 'error' && 'text-down')}>{title}</p>
      {body && <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ink-2">{body}</p>}
      {action && (
        <Button variant={kind === 'error' ? 'secondary' : 'primary'} className="mt-5" onClick={onAction} to={to}>
          {action}
        </Button>
      )}
      {children}
    </div>
  )
}
