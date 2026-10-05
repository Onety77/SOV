import { CURVE_TARGET_SOL, INITIAL_LEVERAGE, MIN_DEPTH_USD, ORACLE_MAX_AGE_S, WINDOW_H } from './rules'

export type Layer = 'curve' | 'spot' | 'checks' | 'perps'

/** The four stages, in the words every page uses. */
export const stages = [
  {
    n: '01',
    title: 'Bonding Curve',
    tag: 'Trading',
    body: 'Price discovery begins. Buyers and sellers trade against the launch curve until its graduation threshold is reached.',
    rule: `Graduates at ${CURVE_TARGET_SOL} SOL raised`,
    layers: ['curve'] as Layer[],
  },
  {
    n: '02',
    title: 'Canonical PumpSwap Spot LP',
    tag: 'Graduated',
    body: 'Liquidity migrates to the canonical spot pool. The spot market remains live through every later stage.',
    rule: 'One canonical pool per coin',
    layers: ['spot'] as Layer[],
  },
  {
    n: '03',
    title: 'Readiness Observation',
    tag: 'Gated',
    body: 'Oracle freshness, price deviation, liquidity depth and sustained spot activity are monitored before leverage.',
    rule: `Oracle under ${ORACLE_MAX_AGE_S}s · depth over $${MIN_DEPTH_USD / 1000}K · ${WINDOW_H}h unbroken`,
    layers: ['spot', 'checks'] as Layer[],
  },
  {
    n: '04',
    title: 'Long & Short Unlock',
    tag: 'Unlocked',
    body: `Coin-backed perpetual markets open at ${INITIAL_LEVERAGE}x initial leverage. Higher limits are outside this concept preview.`,
    rule: `${INITIAL_LEVERAGE}x initial, margin posted in the coin`,
    layers: ['spot', 'perps'] as Layer[],
  },
]
