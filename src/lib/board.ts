import type { Coin, Stage } from './types'
import { checks, curveShare, opensAt } from './readiness'
import { CURVE_TARGET_SOL, WINDOW_H } from './rules'

/*
  The board: one column per stage, in order. Between two columns sits the gate a coin has
  to pass to move right; its rule is written on the boundary. Each column is ordered by
  which coin is likely to move next.
*/

export interface Gate {
  label: string
  /** fits the vertical gate lane */
  short: string
  title: string
  body: string
}

interface Column {
  stage: Stage
  n: string
  name: string
  short: string
  blurb: string
  order: string
  /** the gate on this column's right-hand edge */
  gate?: Gate
}

export const columns: Column[] = [
  {
    stage: 'curve',
    n: '01',
    name: 'Bonding curve',
    short: 'Curve',
    blurb: 'Price discovery against the launch curve.',
    order: 'Closest to graduating first',
    gate: {
      label: `${CURVE_TARGET_SOL} SOL`,
      short: `${CURVE_TARGET_SOL} SOL`,
      title: 'Graduation',
      body: `When a curve has raised ${CURVE_TARGET_SOL} SOL, its liquidity migrates to one canonical PumpSwap pool. Spot trading continues there and never stops after this point.`,
    },
  },
  {
    stage: 'spot',
    n: '02',
    name: 'PumpSwap spot',
    short: 'Spot',
    blurb: 'Graduated. Spot is live; a check is failing.',
    order: 'Fewest failing checks first',
    gate: {
      label: '4 checks hold',
      short: '4 checks',
      title: 'Readiness',
      body: 'Canonical pool, oracle freshness and deviation, and liquidity depth must all hold at once. The moment they do, the observation window starts.',
    },
  },
  {
    stage: 'observation',
    n: '03',
    name: 'Readiness',
    short: 'Readiness',
    blurb: 'Every check holds. The window is running.',
    order: 'Soonest to unlock first',
    gate: {
      label: `${WINDOW_H}h unbroken`,
      short: `${WINDOW_H}h`,
      title: 'Observation window',
      body: `The checks have to keep holding for ${WINDOW_H} hours without a break. If one fails, the window resets and the coin drops back to spot.`,
    },
  },
  {
    stage: 'perps',
    n: '04',
    name: '2x perps',
    short: 'Perps',
    blurb: 'Coin-backed long and short, spot alongside.',
    order: 'Most open interest first',
  },
]

/** Sort a column so the coin likely to move next comes first. */
export function order(stage: Stage, list: Coin[], now: number) {
  const by = (f: (c: Coin) => number) => [...list].sort((a, b) => f(a) - f(b))
  if (stage === 'curve') return by((c) => -curveShare(c))
  if (stage === 'spot') return by((c) => checks(c, now).filter((k) => k.state === 'fail').length * 1e9 - (c.liquidity ?? 0))
  if (stage === 'observation') return by((c) => opensAt(c) ?? 0)
  return by((c) => -(c.perps?.openInterest ?? 0))
}
