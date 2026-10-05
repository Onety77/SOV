import { useDeferredValue, useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Coin } from './types'
import { MIN_QUERY, busiest, searchCoins } from './search'
import { useCoins } from './session'

/**
 * Search-as-you-type: suggestions from the second character, arrow keys move through them,
 * Enter opens the highlighted coin (or the best match), Escape closes.
 */
export function useSearchBox(onDone?: () => void) {
  const navigate = useNavigate()
  const all = useCoins()
  const [query, setQueryState] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const deferred = useDeferredValue(query)
  const hits = useMemo(() => searchCoins(all, deferred), [all, deferred])
  const popular = useMemo(() => busiest(all), [all])
  const tooShort = query.trim().replace(/^\$/, '').length < MIN_QUERY
  const options: Coin[] = tooShort ? popular : hits.map((h) => h.coin)

  const setQuery = (q: string) => {
    setQueryState(q)
    setActive(-1)
    setOpen(true)
  }
  const close = () => {
    setOpen(false)
    setActive(-1)
  }
  const pick = (c: Coin) => {
    navigate(`/markets/${c.id}`)
    setQueryState('')
    close()
    onDone?.()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      if (!options.length) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((a) => (a + step + options.length) % options.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = active >= 0 ? options[active] : !tooShort ? hits[0]?.coin : undefined
      if (target) pick(target)
    } else if (e.key === 'Escape') {
      if (open) close()
      else onDone?.()
      e.currentTarget.blur()
    }
  }
  return { query, setQuery, open, setOpen, close, active, setActive, hits, popular, tooShort, pick, onKeyDown }
}
