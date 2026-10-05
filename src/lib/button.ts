import { cn } from './cn'

export type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'buy' | 'sell'
export type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-accent-strong text-on-accent shadow-[0_0_0_1px_rgb(255_255_255/0.08)_inset,0_8px_30px_-10px_rgb(124_77_255/0.7)] hover-device:hover:shadow-[0_0_0_1px_rgb(255_255_255/0.14)_inset,0_10px_40px_-8px_rgb(124_77_255/0.9)]',
  secondary: 'bg-raised text-ink hover-device:hover:bg-[#23222d]',
  outline: 'text-ink ring-1 ring-inset ring-line-2 hover-device:hover:bg-hover hover-device:hover:ring-ink-4',
  ghost: 'text-ink-2 hover-device:hover:text-ink hover-device:hover:bg-hover',
  buy: 'bg-up text-on-up hover-device:hover:brightness-110',
  sell: 'bg-down text-on-down hover-device:hover:brightness-110',
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
}

export const buttonClass = (variant: Variant = 'secondary', size: Size = 'md', className?: string) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap transition-[background-color,box-shadow,filter,color,scale] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&>svg:last-child]:transition-transform [&>svg:last-child]:duration-300 hover-device:hover:[&>svg.lucide-arrow-right:last-child]:translate-x-0.5',
    variants[variant],
    sizes[size],
    className,
  )
