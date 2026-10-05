import { cn } from '@/lib/cn'
import type { Coin } from '@/lib/types'

/** A coin's mark: its initial on a disc in the coin's own muted hue, with a lighter rim. */
export function CoinMark({ coin, size = 40, className }: { coin: Pick<Coin, 'symbol' | 'hue'>; size?: number; className?: string }) {
  const h = coin.hue
  return (
    <span
      aria-hidden
      className={cn('relative grid shrink-0 place-items-center rounded-full font-display font-[680] [font-stretch:110%]', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        color: `oklch(0.93 0.04 ${h})`,
        background: `radial-gradient(circle at 30% 25%, oklch(0.55 0.13 ${h}), oklch(0.36 0.1 ${h}) 70%)`,
        boxShadow: `inset 0 0 0 ${Math.max(2, size * 0.07)}px oklch(0.68 0.12 ${h} / 0.55)`,
      }}
    >
      {coin.symbol[0]}
    </span>
  )
}
