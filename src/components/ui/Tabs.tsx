import { useId } from 'react'
import { m } from 'motion/react'
import { cn } from '@/lib/cn'
import { SPRING_UI } from '@/lib/motion'

interface Props<T extends string> {
  items: { id: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
  label: string
  className?: string
}

/** Segmented control: a raised pill slides to the chosen tab. */
export function Tabs<T extends string>({ items, value, onChange, label, className }: Props<T>) {
  const group = useId()
  return (
    <div role="tablist" aria-label={label} className={cn('no-scrollbar flex min-w-0 max-w-full gap-0.5 overflow-x-auto rounded-[12px] p-1 ring-1 ring-line-2 ring-inset', className)}>
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          type="button"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            'relative flex h-8 flex-1 shrink-0 items-center justify-center gap-1.5 rounded-[9px] px-3 text-[13px] font-semibold whitespace-nowrap transition-colors duration-200',
            value === it.id ? 'text-ink' : 'text-ink-3 hover-device:hover:text-ink',
          )}
        >
          {value === it.id && <m.span layoutId={`tab-${group}`} className="absolute inset-0 rounded-[9px] bg-raised shadow-[0_1px_0_rgb(255_255_255/0.05)_inset]" transition={SPRING_UI} />}
          <span className="relative">{it.label}</span>
          {it.count !== undefined && <span className="relative font-mono text-[11px] font-normal text-ink-3">{it.count}</span>}
        </button>
      ))}
    </div>
  )
}
