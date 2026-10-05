import { cn } from '@/lib/cn'

/** Three rising bars: curve, spot, leverage. Each stage stands on the one before. */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-6', className)} aria-hidden>
      <rect x="2" y="12" width="5" height="10" rx="1.2" className="fill-accent" opacity="0.55" />
      <rect x="9.5" y="7" width="5" height="15" rx="1.2" className="fill-accent" opacity="0.8" />
      <rect x="17" y="2" width="5" height="20" rx="1.2" className="fill-accent" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      <span className="flex items-baseline gap-1.5">
        <span className="font-display text-[19px] font-[720] tracking-[-0.03em] [font-stretch:115%]">SOV</span>
        <span className="text-[14px] text-ink-3 max-[359px]:hidden">markets</span>
      </span>
    </span>
  )
}
