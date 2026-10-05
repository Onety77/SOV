import type { Coin } from './types'

interface Hit {
  coin: Coin
  field: 'symbol' | 'name' | 'creator'
}

export const MIN_QUERY = 2

/** Coins matching a query, best first: symbol prefix, name prefix, then anywhere. From two characters. */
export function searchCoins(all: Coin[], query: string, limit = 6): Hit[] {
  const q = query.trim().toLowerCase().replace(/^\$/, '')
  if (q.length < MIN_QUERY) return []
  const scored: { hit: Hit; score: number }[] = []
  for (const c of all) {
    const s = c.symbol.toLowerCase()
    const n = c.name.toLowerCase()
    const k = c.creator.toLowerCase()
    let hit: Hit | null = null
    let score = 0
    if (s.startsWith(q)) [hit, score] = [{ coin: c, field: 'symbol' }, 100]
    else if (n.startsWith(q)) [hit, score] = [{ coin: c, field: 'name' }, 90]
    else if (s.includes(q)) [hit, score] = [{ coin: c, field: 'symbol' }, 70]
    else if (n.includes(q)) [hit, score] = [{ coin: c, field: 'name' }, 60]
    else if (k.includes(q)) [hit, score] = [{ coin: c, field: 'creator' }, 50]
    if (hit) scored.push({ hit, score: score + Math.log10(c.volume24h + 1) })
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.hit)
}

/** Shown on focus before typing: the busiest coins. */
export const busiest = (all: Coin[], limit = 4) => [...all].sort((a, b) => b.volume24h - a.volume24h).slice(0, limit)
