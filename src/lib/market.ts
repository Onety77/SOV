import type { Coin } from './types'
import { seeded } from './seeded'
import { SOL_USD } from './rules'

interface Candle {
  o: number
  h: number
  l: number
  c: number
  v: number
}

/** Seeded candles that end at the current price, for sample charts. */
export function candles(seed: string, last: number, change: number, n = 60): Candle[] {
  const r = seeded(seed + '-c')
  const first = last / (1 + change * 3)
  const out: Candle[] = []
  let prev = first
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const target = first + (last - first) * t
    const c = i === n - 1 ? last : target * (1 + (r() - 0.5) * 0.08) + (prev - target) * 0.35
    const o = prev
    const h = Math.max(o, c) * (1 + r() * 0.03)
    const l = Math.min(o, c) * (1 - r() * 0.03)
    out.push({ o, h, l, c, v: 0.3 + r() * (Math.abs(c - o) / o) * 20 })
    prev = c
  }
  return out
}

/** A short closing-price line for sparklines. */
export const spark = (c: Coin, n = 24) => candles(c.id, c.price, c.change24h, n).map((k) => k.c)

interface Trade {
  id: string
  side: 'buy' | 'sell'
  sol: number
  tokens: number
  wallet: string
  at: number
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const addr = (r: () => number) => {
  const pick = () => B58[Math.floor(r() * B58.length)]
  return `${pick()}${pick()}${pick()}${pick()}…${pick()}${pick()}${pick()}${pick()}`
}

/** Recent sample trades, newest first. */
export function trades(c: Coin, now: number, n = 12): Trade[] {
  const r = seeded(c.id + '-t')
  let at = now - Math.floor(r() * 30) * 1000
  return Array.from({ length: n }, (_, i) => {
    const side = r() > 0.44 ? 'buy' : 'sell'
    const s = Math.round((0.05 + r() ** 2 * 5) * 1000) / 1000
    const t: Trade = { id: `${c.id}-${i}`, side, sol: s, tokens: (s * SOL_USD) / c.price, wallet: addr(r), at }
    at -= Math.floor(15 + r() * 300) * 1000
    return t
  })
}

export const tokens = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(Math.round(n)))
