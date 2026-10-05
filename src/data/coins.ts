import type { Coin } from '@/lib/types'
import { WINDOW_H } from '@/lib/rules'

/*
  Fictional sample coins, so the interface has something to show. Times are relative to the
  moment the page loads, so the observation windows and oracle heartbeats are always live:
  SABLE is minutes away from finishing its window and opens perps while you browse.
*/

const NOW = Date.now()
const H = 3_600_000
const M = 60_000
const SUPPLY = 100_000_000
const WINDOW = WINDOW_H * H

const base = (c: Omit<Coin, 'supply' | 'launchedAt' | 'holders'> & { age: number; holders?: number }): Coin => {
  const { age, holders, ...rest } = c
  return { supply: SUPPLY, launchedAt: NOW - age, holders: holders ?? Math.round(c.volume24h / 60), ...rest }
}

export const loadedAt = NOW

export const coins: Coin[] = [
  // ── perps open ──
  base({
    id: 'lumen', symbol: 'LUMEN', name: 'Lumen', hue: 265, age: 19 * 24 * H, creator: 'halcyon.sol',
    blurb: 'Lighting for on-chain dashboards. Indexers pay in LUMEN for priority refresh.',
    price: 0.0031, change24h: 0.064, volume24h: 412_000, holders: 6_210,
    graduatedAt: NOW - 16 * 24 * H, liquidity: 184_000,
    oracle: { period: 4, phase: 1.2, deviationPct: 0.3 },
    windowStartedAt: NOW - 14 * 24 * H,
    perps: { openInterest: 96_400, fundingHourly: 0.00011, longShare: 0.58 },
  }),
  base({
    id: 'cobalt', symbol: 'CBLT', name: 'Cobalt', hue: 215, age: 23 * 24 * H, creator: 'oreworks',
    blurb: 'A community mining sim. Every season burns a share of what the guilds earn.',
    price: 0.00214, change24h: -0.018, volume24h: 268_000, holders: 4_480,
    graduatedAt: NOW - 20 * 24 * H, liquidity: 131_000,
    oracle: { period: 5, phase: 3.1, deviationPct: 0.5 },
    windowStartedAt: NOW - 18 * 24 * H,
    perps: { openInterest: 61_200, fundingHourly: -0.00004, longShare: 0.46 },
  }),
  base({
    id: 'fern', symbol: 'FERN', name: 'Fern', hue: 150, age: 11 * 24 * H, creator: 'greenhouse',
    blurb: 'Pays out to wallets that plant and verify real trees through a partner registry.',
    price: 0.00168, change24h: 0.021, volume24h: 154_000, holders: 3_020,
    graduatedAt: NOW - 8 * 24 * H, liquidity: 77_500,
    oracle: { period: 6, phase: 0.4, deviationPct: 0.7 },
    windowStartedAt: NOW - 6 * 24 * H,
    perps: { openInterest: 28_900, fundingHourly: 0.00007, longShare: 0.61 },
  }),
  base({
    id: 'kiln', symbol: 'KILN', name: 'Kiln', hue: 22, age: 9 * 24 * H, creator: 'potter',
    blurb: 'Fires generative ceramics on-chain. Holders vote on the next glaze.',
    price: 0.00122, change24h: -0.034, volume24h: 98_000, holders: 2_140,
    graduatedAt: NOW - 6 * 24 * H, liquidity: 52_300,
    oracle: { period: 5, phase: 2.2, deviationPct: 0.9 },
    windowStartedAt: NOW - 3 * 24 * H,
    perps: { openInterest: 17_400, fundingHourly: -0.00009, longShare: 0.41 },
  }),

  // ── in observation: every check holds, the window is running ──
  base({
    id: 'sable', symbol: 'SABLE', name: 'Sable', hue: 285, age: 5 * 24 * H, creator: 'nightshift',
    blurb: 'A night-market for digital goods. Stalls open at dusk UTC and close at dawn.',
    price: 0.00104, change24h: 0.042, volume24h: 71_000,
    graduatedAt: NOW - 3 * 24 * H, liquidity: 41_800,
    oracle: { period: 4, phase: 0.8, deviationPct: 0.4 },
    windowStartedAt: NOW - (WINDOW - 4 * M - 20_000),
    perps: { openInterest: 0, fundingHourly: 0, longShare: 0.5 },
  }),
  base({
    id: 'tide', symbol: 'TIDE', name: 'Tide', hue: 172, age: 4 * 24 * H, creator: 'harbourmaster',
    blurb: 'Tracks real tide gauges and settles small prediction pools against them.',
    price: 0.00387, change24h: 0.012, volume24h: 88_000,
    graduatedAt: NOW - 2 * 24 * H, liquidity: 38_700,
    oracle: { period: 6, phase: 1.8, deviationPct: 0.6 },
    windowStartedAt: NOW - 14 * H - 2 * M,
  }),
  base({
    id: 'pebble', symbol: 'PBL', name: 'Pebble', hue: 250, age: 3 * 24 * H, creator: 'quarry',
    blurb: 'Small, round and stubborn. A meme coin that funds skate-park repairs.',
    price: 0.00091, change24h: -0.021, volume24h: 46_000,
    graduatedAt: NOW - 30 * H, liquidity: 22_100,
    oracle: { period: 5, phase: 4.1, deviationPct: 1.1 },
    windowStartedAt: NOW - 2 * H - 14 * M,
  }),

  // ── graduated to spot, but a check is failing: no window yet ──
  base({
    id: 'wisp', symbol: 'WISP', name: 'Wisp', hue: 200, age: 2 * 24 * H, creator: 'lanternlab',
    blurb: 'Ambient sound NFTs that evolve with how often they are played.',
    price: 0.00062, change24h: 0.087, volume24h: 39_000,
    graduatedAt: NOW - 20 * H, liquidity: 31_400,
    oracle: { period: 5, phase: 0, staleSince: 41, deviationPct: 0.8 },
  }),
  base({
    id: 'moss', symbol: 'MOSS', name: 'Moss', hue: 95, age: 46 * H, creator: 'slowgrow',
    blurb: 'A slow game: your garden grows one tile a day if you hold.',
    price: 0.00071, change24h: -0.046, volume24h: 21_000,
    graduatedAt: NOW - 9 * H, liquidity: 14_600,
    oracle: { period: 6, phase: 2.5, deviationPct: 1.3 },
  }),

  // ── on the bonding curve ──
  base({
    id: 'glint', symbol: 'GLNT', name: 'Glint', hue: 48, age: 7 * H, creator: 'magpie',
    blurb: 'Collect shiny things others drop in chat. The rarest glints are tradeable.',
    price: 0.000182, change24h: 0.31, volume24h: 64_000, raisedSol: 77.4,
  }),
  base({
    id: 'ember', symbol: 'EMBR', name: 'Ember', hue: 12, age: 11 * H, creator: 'firewatch',
    blurb: 'Rewards fire-lookout volunteers who report smoke early with photo proof.',
    price: 0.000151, change24h: 0.18, volume24h: 52_000, raisedSol: 69.7,
  }),
  base({
    id: 'drift', symbol: 'DRFT', name: 'Drift', hue: 225, age: 15 * H, creator: 'sidewaysco',
    blurb: 'Sim-racing league. Lap records mint, and the season pot pays the top ten.',
    price: 0.000098, change24h: 0.07, volume24h: 33_000, raisedSol: 54.1,
  }),
  base({
    id: 'brine', symbol: 'BRINE', name: 'Brine', hue: 190, age: 20 * H, creator: 'saltpan',
    blurb: 'Pickles. That is the whole roadmap and the community is fine with it.',
    price: 0.000061, change24h: -0.06, volume24h: 14_000, raisedSol: 31.6,
  }),
  base({
    id: 'quill', symbol: 'QUILL', name: 'Quill', hue: 330, age: 3 * H, creator: 'inkwell',
    blurb: 'Serial fiction where holders pick what happens in the next chapter.',
    price: 0.000044, change24h: 0.12, volume24h: 9_000, raisedSol: 18.9,
  }),
]

