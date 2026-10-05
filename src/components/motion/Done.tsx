import type { ReactNode } from 'react'
import { m } from 'motion/react'
import { Check } from 'lucide-react'

/** A confirmation: a green check lands, then the words fade in beside it. */
export function Done({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink-2">
      <m.span
        className="grid size-4 shrink-0 place-items-center rounded-full bg-proven text-[#04140b]"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 24 }}
      >
        <Check className="size-2.5" strokeWidth={3.5} />
      </m.span>
      <m.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        {children}
      </m.span>
    </span>
  )
}
