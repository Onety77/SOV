import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { ArrowRight, BookOpen, CornerDownLeft, Plus, RotateCcw, Search, Wallet } from 'lucide-react'
import type { Stage } from '@/lib/types'
import { cn } from '@/lib/cn'
import { EASE_OUT, EASE_UI, SPRING_UI } from '@/lib/motion'
import { columns } from '@/lib/board'
import { useNow } from '@/lib/clock'
import { usd } from '@/lib/format'
import { stageOf } from '@/lib/readiness'
import { MIN_QUERY, busiest, searchCoins } from '@/lib/search'
import { palette, showStage, toggleWallet, useCoins, wallet } from '@/lib/session'
import { useMedia } from '@/lib/useMedia'
import { CoinMark } from '@/components/ui/CoinMark'
import { StageTag } from '@/components/ui/StageTag'
import { Highlight } from './Highlight'

interface Item {
  id: string
  group: 'Coins' | 'Stages' | 'Actions' | 'Most traded'
  label: string
  hint?: string
  icon: ReactNode
  aside?: ReactNode
  run: () => void
  /** for highlighting the match */
  text?: string
}

/**
 * The one way around the site. It finds coins as you type (from two letters), jumps the
 * board to a stage, and runs the few actions there are: launch, how it works, wallet,
 * replay the intro. It replaces a nav bar, a menu and a search box.
 */
export function Palette() {
  const open = palette.use()
  return createPortal(<AnimatePresence>{open && <Panel onClose={() => palette.set(false)} />}</AnimatePresence>, document.body)
}

function Panel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const all = useCoins()
  const now = useNow()
  const address = wallet.use()
  const wide = useMedia('(min-width: 768px)')
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const q = useDeferredValue(query).trim().replace(/^\$/, '').toLowerCase()

  const items = useMemo(() => {
    const go = (fn: () => void) => () => {
      onClose()
      fn()
    }
    const actions: Item[] = [
      { id: 'launch', group: 'Actions', label: 'Create a launch', hint: 'Start a coin on its curve', icon: <Plus className="size-4" />, run: go(() => navigate('/launch')) },
      { id: 'how', group: 'Actions', label: 'How SOV works', hint: 'The four stages and their gates', icon: <BookOpen className="size-4" />, run: go(() => navigate('/how')) },
      { id: 'wallet', group: 'Actions', label: address ? 'Disconnect wallet' : 'Connect wallet', hint: address ?? 'Concept only, nothing is signed', icon: <Wallet className="size-4" />, run: go(toggleWallet) },
      { id: 'intro', group: 'Actions', label: 'Replay the intro', icon: <RotateCcw className="size-4" />, run: go(() => navigate('/')) },
    ]
    const stages: Item[] = columns.map((c) => ({
      id: `stage-${c.stage}`,
      group: 'Stages',
      label: `${c.name}`,
      hint: c.blurb,
      icon: <span className="font-mono text-[11px] text-accent-text">{c.n}</span>,
      aside: <span className="font-mono text-[12px] text-ink-3">{all.filter((x) => stageOf(x, now) === c.stage).length}</span>,
      run: go(() => {
        navigate('/markets')
        showStage(c.stage as Stage)
      }),
    }))
    const coin = (group: Item['group']) => (c: (typeof all)[number]): Item => ({
      id: `coin-${c.id}`,
      group,
      label: c.name,
      text: c.symbol,
      hint: `$${c.symbol} · ${usd(c.price * c.supply)}`,
      icon: <CoinMark coin={c} size={28} />,
      aside: <StageTag stage={stageOf(c, now)} className="max-[380px]:hidden" />,
      run: go(() => navigate(`/markets/${c.id}`)),
    })
    if (q.length < MIN_QUERY) return [...actions, ...stages, ...busiest(all, 3).map(coin('Most traded'))]
    const match = (i: Item) => i.label.toLowerCase().includes(q) || (i.hint ?? '').toLowerCase().includes(q)
    return [...searchCoins(all, q, 6).map((h) => coin('Coins')(h.coin)), ...stages.filter(match), ...actions.filter(match)]
  }, [q, all, address, navigate, onClose, now])

  const pick = Math.min(active, items.length - 1)
  useEffect(() => {
    document.getElementById(`${id}-${pick}`)?.scrollIntoView({ block: 'nearest' })
  }, [pick, id])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const n = items.length
      if (n) setActive((a) => (Math.min(a, n - 1) + (e.key === 'ArrowDown' ? 1 : -1) + n) % n)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      items[pick]?.run()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  let last = ''
  return (
    <div data-palette className="fixed inset-0 z-[60]" onKeyDown={onKey}>
      <m.div aria-hidden className="absolute inset-0 bg-[rgb(5_4_9/0.6)] backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
      <m.div
        role="dialog"
        aria-modal="true"
        aria-label="Search and jump"
        className={cn(
          'absolute flex flex-col overflow-hidden bg-surface shadow-[0_0_0_1px_var(--line-2),0_40px_100px_-20px_rgb(0_0_0/0.95)]',
          wide ? 'top-[12vh] left-1/2 max-h-[min(620px,76vh)] w-[min(600px,calc(100vw-32px))] -translate-x-1/2 rounded-[18px]' : 'inset-0 pt-[env(safe-area-inset-top,0px)]',
        )}
        initial={wide ? { opacity: 0, y: -10, scale: 0.98 } : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: wide ? -6 : -12, scale: wide ? 0.98 : 1, transition: { duration: 0.14 } }}
        transition={{ duration: 0.26, ease: EASE_OUT }}
      >
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
          <Search className="size-[18px] shrink-0 text-ink-3" />
          <input
            ref={input}
            autoFocus
            type="text"
            role="combobox"
            aria-expanded
            aria-controls={`${id}-list`}
            aria-activedescendant={items.length ? `${id}-${pick}` : undefined}
            aria-label="Search coins, stages and actions"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="Search coins, stages, actions"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none focus-visible:outline-none"
          />
          {wide ? (
            <kbd className="rounded-[6px] px-1.5 py-0.5 text-[11px] text-ink-3 ring-1 ring-line-2">esc</kbd>
          ) : (
            <button type="button" onClick={onClose} className="h-10 px-1 text-[15px] font-medium text-ink-2">
              Cancel
            </button>
          )}
        </div>
        <ul id={`${id}-list`} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {!items.length && <li className="px-3 py-8 text-center text-[14px] text-ink-3">Nothing matches “{query.trim()}”. Try a ticker like TIDE.</li>}
          {items.map((it, i) => {
            const head = it.group !== last
            last = it.group
            return (
              <li key={it.id} role="presentation">
                {head && <p className="label px-3 pt-3 pb-1.5">{it.group}</p>}
                <div
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={pick === i}
                  onMouseMove={() => setActive(i)}
                  onClick={it.run}
                  className="relative flex cursor-pointer items-center gap-3 rounded-[11px] px-3 py-2.5"
                >
                  {/* one highlight that glides between rows as you move */}
                  {pick === i && <m.span layoutId="palette-on" className="absolute inset-0 rounded-[11px] bg-raised" transition={SPRING_UI} />}
                  <span className="relative grid size-8 shrink-0 place-items-center rounded-[9px] text-ink-2">{it.icon}</span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">
                      <Highlight text={it.label} query={it.group === 'Coins' ? q : ''} />
                      {it.text && (
                        <span className="ml-1.5 font-mono text-[12px] font-normal text-ink-3">
                          $<Highlight text={it.text} query={q} />
                        </span>
                      )}
                    </span>
                    {it.hint && <span className="block truncate text-[12px] text-ink-3">{it.hint}</span>}
                  </span>
                  <span className="relative">{it.aside}</span>
                  <AnimatePresence>
                    {pick === i && wide && (
                      <m.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: EASE_UI }} className="text-ink-3">
                        {it.group === 'Coins' || it.group === 'Most traded' ? <ArrowRight className="size-4" /> : <CornerDownLeft className="size-4" />}
                      </m.span>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            )
          })}
        </ul>
        {wide && (
          <p className="flex shrink-0 gap-4 border-t border-line px-4 py-2.5 font-mono text-[11px] text-ink-3">
            <span>↑↓ move</span>
            <span>↵ open</span>
            <span>⌘K anywhere</span>
          </p>
        )}
      </m.div>
    </div>
  )
}
