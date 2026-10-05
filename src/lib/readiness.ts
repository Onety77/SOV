import type { Check, Coin, Stage } from './types'
import { loadedAt } from '@/data/coins'
import { CURVE_TARGET_SOL, INITIAL_LEVERAGE, MAX_DEVIATION_PCT, MIN_DEPTH_USD, ORACLE_MAX_AGE_S, WINDOW_H } from './rules'
import { span, usd } from './format'

/*
  The readiness gate. A graduated coin exposes the same four checks; the observation window
  only runs while the first three hold, and perps open once it has run for WINDOW_H unbroken.
  Everything here is derived from the clock, so stages change live.
*/

const WINDOW_MS = WINDOW_H * 3_600_000

/** Seconds since the oracle last updated. */
export function oracleAge(c: Coin, now: number) {
  const o = c.oracle
  if (!o) return 0
  const t = (now - loadedAt) / 1000
  if (o.staleSince !== undefined) return o.staleSince + t
  // updates arrive every `period` seconds; age runs from ~0.3s up to the period
  return 0.3 + (((t + o.phase) % o.period) + o.period) % o.period
}

const oracleOk = (c: Coin) => Boolean(c.oracle && c.oracle.staleSince === undefined && c.oracle.deviationPct <= MAX_DEVIATION_PCT)
const depthOk = (c: Coin) => (c.liquidity ?? 0) >= MIN_DEPTH_USD

export const windowElapsed = (c: Coin, now: number) => (c.windowStartedAt ? Math.min(WINDOW_MS, now - c.windowStartedAt) : 0)

export function stageOf(c: Coin, now: number): Stage {
  if (c.raisedSol !== undefined && c.graduatedAt === undefined) return 'curve'
  if (!c.windowStartedAt || !oracleOk(c) || !depthOk(c)) return 'spot'
  return windowElapsed(c, now) >= WINDOW_MS ? 'perps' : 'observation'
}

/** When perps open, if the window keeps holding. */
export const opensAt = (c: Coin) => (c.windowStartedAt ? c.windowStartedAt + WINDOW_MS : undefined)

export function checks(c: Coin, now: number): Check[] {
  const age = oracleAge(c, now)
  const stale = c.oracle?.staleSince !== undefined || age > ORACLE_MAX_AGE_S
  const dev = c.oracle?.deviationPct ?? 0
  const devBad = dev > MAX_DEVIATION_PCT
  const elapsed = windowElapsed(c, now)
  const othersHold = oracleOk(c) && depthOk(c)
  const done = elapsed >= WINDOW_MS
  const hours = Math.floor(elapsed / 3_600_000)
  return [
    { id: 'pool', label: 'Canonical spot pool', detail: 'PumpSwap pool detected', value: 'Verified', state: 'pass' },
    {
      id: 'oracle',
      label: 'Oracle freshness',
      detail: stale ? `Stale: last update over ${ORACLE_MAX_AGE_S}s ago` : devBad ? `Deviation ${dev}% is above ${MAX_DEVIATION_PCT}%` : `Below ${ORACLE_MAX_AGE_S}s, within ${MAX_DEVIATION_PCT}% of pool`,
      value: `${age.toFixed(1)}s`,
      state: stale || devBad ? 'fail' : 'pass',
    },
    {
      id: 'depth',
      label: 'Liquidity depth',
      detail: depthOk(c) ? `Above ${usd(MIN_DEPTH_USD)} minimum` : `Below ${usd(MIN_DEPTH_USD)} minimum`,
      value: usd(c.liquidity ?? 0),
      state: depthOk(c) ? 'pass' : 'fail',
    },
    {
      id: 'window',
      label: 'Observation window',
      detail: done ? `Held for ${WINDOW_H}h unbroken` : othersHold && c.windowStartedAt ? `${span(WINDOW_MS - elapsed)} remaining` : 'Starts when the other checks hold',
      value: `${done ? WINDOW_H : othersHold ? hours : 0}h / ${WINDOW_H}h`,
      state: done ? 'pass' : 'pending',
    },
  ]
}

/** One line on what a coin is waiting for. */
export function nextStep(c: Coin, now: number) {
  const s = stageOf(c, now)
  if (s === 'curve') return `${Math.round(((c.raisedSol ?? 0) / CURVE_TARGET_SOL) * 100)}% to graduation`
  if (s === 'spot') return !depthOk(c) ? 'Waiting on liquidity depth' : 'Waiting on the oracle'
  if (s === 'observation') return `Perps in ${span(WINDOW_MS - windowElapsed(c, now))}`
  return `${INITIAL_LEVERAGE}x long & short open`
}

export const curveShare = (c: Coin) => Math.min(1, (c.raisedSol ?? 0) / CURVE_TARGET_SOL)
