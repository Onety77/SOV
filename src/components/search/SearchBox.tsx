import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { EASE_UI } from '@/lib/motion'
import { useSearchBox } from '@/lib/useSearchBox'
import { SearchResults } from './SearchResults'

/** Desktop and tablet: an always-visible field with suggestions underneath. Press / to jump to it. */
export function SearchBox({ className }: { className?: string }) {
  const s = useSearchBox()
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === '/' && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div ref={wrap} className={cn('relative', className)} onBlur={(e) => !wrap.current?.contains(e.relatedTarget as Node) && s.close()}>
      <div className={cn('flex h-10 items-center gap-2 rounded-control bg-raised px-3 ring-1 transition-shadow focus-within:ring-accent', s.open ? 'ring-line-2' : 'ring-transparent')}>
        <Search className="size-4 shrink-0 text-ink-3" />
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-label="Search coins"
          aria-expanded={s.open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={s.active >= 0 ? `${id}-list-${s.active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Search coins"
          value={s.query}
          onChange={(e) => s.setQuery(e.target.value)}
          onFocus={() => s.setOpen(true)}
          onKeyDown={s.onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none focus-visible:outline-none"
        />
        {s.query ? (
          <button type="button" aria-label="Clear search" onClick={() => (s.setQuery(''), input.current?.focus())} className="grid size-5 place-items-center rounded-full text-ink-3 hover-device:hover:text-ink">
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="rounded-[5px] bg-surface px-1.5 font-mono text-[11px] text-ink-3">/</kbd>
        )}
      </div>
      <AnimatePresence>
        {s.open && (
          <m.div
            initial={{ opacity: 0, y: -4, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.985, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: EASE_UI }}
            className="absolute top-full right-0 z-50 mt-2 w-[min(400px,calc(100vw-32px))] origin-top overflow-hidden rounded-[14px] bg-surface shadow-[0_0_0_1px_var(--line-2),0_24px_60px_-20px_rgb(0_0_0/0.9)]"
          >
            <SearchResults id={`${id}-list`} query={s.query} hits={s.hits} popular={s.popular} active={s.active} onHover={s.setActive} onPick={s.pick} tooShort={s.tooShort} />
            <p className="flex gap-3 border-t border-line px-3 py-2 font-mono text-[11px] text-ink-3">
              <span>↑↓ move</span>
              <span>↵ open</span>
              <span>esc close</span>
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
