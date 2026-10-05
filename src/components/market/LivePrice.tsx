import { cn } from '@/lib/cn'
import { change, price } from '@/lib/format'
import { useQuote } from '@/lib/live'
import { Ticking } from '@/components/motion/Ticking'

/** A coin's live price; it rolls and glows when it ticks. */
export function LivePrice({ id, className }: { id: string; className?: string }) {
  const q = useQuote(id)
  return <Ticking value={q.price} text={price(q.price)} className={className} />
}

/** The 24h change as a small coloured figure. */
export function LiveChange({ id, className }: { id: string; className?: string }) {
  const q = useQuote(id)
  return <span className={cn('font-mono tabular', q.change24h >= 0 ? 'text-up' : 'text-down', className)}>{change(q.change24h)}</span>
}
