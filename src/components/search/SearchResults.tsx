import type { Coin } from '@/lib/types'
import { cn } from '@/lib/cn'
import { usd } from '@/lib/format'
import type { Hit } from '@/lib/search'
import { useNow } from '@/lib/clock'
import { stageOf } from '@/lib/readiness'
import { CoinMark } from '@/components/ui/CoinMark'
import { StageTag } from '@/components/ui/StageTag'
import { Highlight } from './Highlight'

interface Props {
  id: string
  query: string
  hits: Hit[]
  popular: Coin[]
  active: number
  onHover: (i: number) => void
  onPick: (c: Coin) => void
  tooShort: boolean
}

/** The suggestion list shared by the desktop dropdown and the phone sheet. */
export function SearchResults({ id, query, hits, popular, active, onHover, onPick, tooShort }: Props) {
  const now = useNow()
  const rows: { c: Coin; field?: Hit['field'] }[] = tooShort ? popular.map((c) => ({ c })) : hits.map((h) => ({ c: h.coin, field: h.field }))
  return (
    <div>
      <p className="label px-3 pt-3 pb-1.5">{tooShort ? 'Most traded' : hits.length ? `${hits.length} ${hits.length === 1 ? 'coin' : 'coins'}` : 'No matches'}</p>
      {!tooShort && !hits.length && <p className="px-3 pb-4 text-[13px] text-ink-3">Nothing matches “{query.trim()}”. Try a ticker like TIDE.</p>}
      <ul id={id} role="listbox" aria-label="Suggestions" className="pb-2">
        {rows.map(({ c, field }, i) => (
          <li
            key={c.id}
            id={`${id}-${i}`}
            role="option"
            aria-selected={active === i}
            onMouseEnter={() => onHover(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(c)}
            className={cn('mx-1.5 flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2', active === i && 'bg-raised')}
          >
            <CoinMark coin={c} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium">
                <Highlight text={c.name} query={field === 'name' ? query : ''} />{' '}
                <span className="font-mono text-[12px] font-normal text-ink-3">
                  $<Highlight text={c.symbol} query={field === 'symbol' ? query : ''} />
                </span>
              </p>
              <p className="truncate text-[12px] text-ink-3">
                by <Highlight text={c.creator} query={field === 'creator' ? query : ''} /> · {usd(c.price * c.supply)}
              </p>
            </div>
            <StageTag stage={stageOf(c, now)} className="max-[360px]:hidden" />
          </li>
        ))}
      </ul>
    </div>
  )
}
