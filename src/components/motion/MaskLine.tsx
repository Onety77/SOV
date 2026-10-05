import type { ReactNode } from 'react'
import { m } from 'motion/react'
import { cn } from '@/lib/cn'
import { EASE_OUT } from '@/lib/motion'

/** A headline line that slides up from behind a mask. Padding keeps descenders inside it. */
export function MaskLine({ children, delay = 0, play = true, className }: { children: ReactNode; delay?: number; play?: boolean; className?: string }) {
  return (
    <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
      <m.span className={cn('block', className)} initial={{ y: '135%' }} animate={{ y: play ? '0%' : '135%' }} transition={{ duration: 0.95, delay, ease: EASE_OUT }}>
        {children}
      </m.span>
    </span>
  )
}
