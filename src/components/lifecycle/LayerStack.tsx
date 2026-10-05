import { cn } from '@/lib/cn'
import type { Layer } from '@/lib/lifecycle'

const look: Record<Layer, { label: string; cls: string }> = {
  curve: { label: 'Curve', cls: 'bg-raised text-ink-2' },
  spot: { label: 'Spot', cls: 'bg-ink text-bg' },
  checks: { label: 'Checks', cls: 'border border-dashed border-accent/60 text-accent-text [background:repeating-linear-gradient(-45deg,rgb(139_92_246/0.14)_0_4px,transparent_4px_8px)]' },
  perps: { label: '2x perps', cls: 'bg-accent-strong text-on-accent' },
}

/** Which markets are open at a stage, drawn as layers that stack: each stage adds one. */
export function LayerStack({ layers, className }: { layers: Layer[]; className?: string }) {
  return (
    <div aria-label={`Open: ${layers.map((l) => look[l].label).join(' and ')}`} role="img" className={cn('flex w-full flex-col-reverse gap-1 lg:h-[68px]', className)}>
      {layers.map((l) => (
        <span key={l} className={cn('flex h-[32px] items-center rounded-[8px] px-2.5 font-mono text-[11px] font-medium tracking-[0.04em] uppercase', look[l].cls)}>
          {look[l].label}
        </span>
      ))}
    </div>
  )
}
