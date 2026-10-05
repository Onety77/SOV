import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m } from 'motion/react'
import { Search } from 'lucide-react'
import { EASE_OUT } from '@/lib/motion'
import { useSearchBox } from '@/lib/useSearchBox'
import { SearchResults } from './SearchResults'

/** Phones: a search icon that opens a full-screen search with suggestions as you type. */
export function SearchSheet({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Search coins" className={className}>
        <Search className="size-[18px]" />
      </button>
      {createPortal(<AnimatePresence>{open && <Sheet onClose={() => setOpen(false)} />}</AnimatePresence>, document.body)}
    </>
  )
}

function Sheet({ onClose }: { onClose: () => void }) {
  const s = useSearchBox(onClose)
  const id = useId()

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-[60] flex flex-col bg-bg pt-[env(safe-area-inset-top)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
    >
      <m.div className="flex items-center gap-2 border-b border-line px-4 py-2.5" initial={{ y: -10 }} animate={{ y: 0 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
        <div className="flex h-11 flex-1 items-center gap-2 rounded-control bg-raised px-3">
          <Search className="size-4 shrink-0 text-ink-3" />
          <input
            autoFocus
            type="search"
            enterKeyHint="go"
            role="combobox"
            aria-label="Search coins"
            aria-expanded
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={s.active >= 0 ? `${id}-list-${s.active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search coins"
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            onKeyDown={s.onKeyDown}
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none"
          />
        </div>
        <button type="button" onClick={onClose} className="h-11 px-2 text-[15px] font-medium text-ink-2">
          Cancel
        </button>
      </m.div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-1 pb-[env(safe-area-inset-bottom)]">
        <SearchResults id={`${id}-list`} query={s.query} hits={s.hits} popular={s.popular} active={s.active} onHover={s.setActive} onPick={s.pick} tooShort={s.tooShort} />
      </div>
    </m.div>
  )
}
