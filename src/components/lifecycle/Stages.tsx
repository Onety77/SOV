import { cn } from '@/lib/cn'
import { stages } from '@/lib/lifecycle'
import { LayerStack } from './LayerStack'

/**
 * The four stages. Phones: a numbered timeline. Wide screens: four columns joined by a
 * rail, each showing the markets that are open at that stage.
 */
export function Stages({ detail = false, className }: { detail?: boolean; className?: string }) {
  return (
    <ol className={cn('relative grid gap-0 lg:grid-cols-4 lg:gap-6', className)}>
      <span aria-hidden className="absolute top-[18px] right-[12%] left-[18px] hidden h-px bg-line-2 lg:block" />
      <span aria-hidden className="absolute top-4 bottom-6 left-[17.5px] w-px bg-line-2 lg:hidden" />
      {stages.map((s) => (
        <li key={s.n} className="relative grid grid-cols-[36px_1fr] gap-x-4 pb-8 last:pb-0 lg:block lg:pb-0">
          <span className="relative z-10 grid size-9 place-items-center rounded-full bg-bg font-mono text-[12px] font-medium text-accent-text ring-[1.5px] ring-accent ring-inset">{s.n}</span>
          <div className="lg:mt-5">
            <h3 className="font-display text-[19px] font-[640] tracking-[-0.02em] [font-stretch:110%] lg:min-h-[2.5em]">{s.title}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{s.body}</p>
            {detail && <p className="mt-3 font-mono text-[12px] text-ink-3">{s.rule}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-[6px] bg-raised px-2 py-1 font-mono text-[10.5px] font-medium tracking-[0.1em] text-ink-2 uppercase">{s.tag}</span>
            </div>
            <LayerStack layers={s.layers} className="mt-4 max-w-[240px] lg:mt-5" />
          </div>
        </li>
      ))}
    </ol>
  )
}
