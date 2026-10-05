import { useSyncExternalStore } from 'react'
import type { Coin } from './types'
import { coins } from '@/data/coins'

/*
  Simulated live market: every couple of seconds two or three coins tick a fraction of a
  percent; curve coins also take in a little SOL. One timer for the app; components read a
  coin's live figures through useQuote(id). Swap this module for a real feed.
*/

interface Quote {
  price: number
  change24h: number
  mcap: number
  raisedSol?: number
  /** increments on every tick, so charts can follow */
  tick: number
}

const open = new Map<string, number>()
let quotes: Record<string, Quote> = {}

export function track(c: Coin) {
  open.set(c.id, c.price / (1 + c.change24h))
  quotes = { ...quotes, [c.id]: { price: c.price, change24h: c.change24h, mcap: c.price * c.supply, raisedSol: c.raisedSol, tick: 0 } }
}
coins.forEach(track)

const subs = new Set<() => void>()
let timer: number | undefined

function step() {
  if (document.hidden) return
  const ids = Object.keys(quotes)
  const n = 2 + Math.floor(Math.random() * 2)
  const next = { ...quotes }
  for (let i = 0; i < n; i++) {
    const id = ids[Math.floor(Math.random() * ids.length)]
    const q = next[id]
    const curve = q.raisedSol !== undefined
    const move = (Math.random() - 0.46) * (curve ? 0.014 : 0.008)
    const p = q.price * (1 + move)
    next[id] = {
      price: p,
      change24h: p / open.get(id)! - 1,
      mcap: q.mcap * (1 + move),
      raisedSol: curve ? Math.min(84.9, q.raisedSol! + Math.max(0, move) * 40) : undefined,
      tick: q.tick + 1,
    }
  }
  quotes = next
  subs.forEach((f) => f())
}

function subscribe(cb: () => void) {
  subs.add(cb)
  if (timer === undefined) {
    const loop = () => {
      step()
      timer = window.setTimeout(loop, 1800 + Math.random() * 2400)
    }
    timer = window.setTimeout(loop, 1400)
  }
  return () => {
    subs.delete(cb)
    if (!subs.size && timer !== undefined) {
      window.clearTimeout(timer)
      timer = undefined
    }
  }
}

/** A coin's live figures. */
export const useQuote = (id: string) => useSyncExternalStore(subscribe, () => quotes[id])
/** Every coin's live figures (for sorting lists). */
export const useQuotes = () => useSyncExternalStore(subscribe, () => quotes)
