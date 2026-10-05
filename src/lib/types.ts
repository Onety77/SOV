/** Where a coin is in its life. Each stage adds a market; none takes one away. */
export type Stage = 'curve' | 'spot' | 'observation' | 'perps'

export interface Coin {
  id: string
  symbol: string
  name: string
  /** hue for the coin's mark, 0–360 */
  hue: number
  blurb: string
  creator: string
  launchedAt: number
  /** a coin you launched this visit */
  mine?: boolean

  price: number
  change24h: number
  supply: number
  volume24h: number
  holders: number

  /** curve stage: SOL raised so far */
  raisedSol?: number

  /** graduated: the canonical PumpSwap pool and what the readiness checks see */
  graduatedAt?: number
  liquidity?: number
  oracle?: {
    /** seconds between oracle updates */
    period: number
    /** seconds after load of the first update */
    phase: number
    /** a feed that stopped updating: age at load */
    staleSince?: number
    deviationPct: number
  }
  /** when the current observation window began (all other checks holding) */
  windowStartedAt?: number

  /** perps open: market figures */
  perps?: { openInterest: number; fundingHourly: number; longShare: number }
}

export type CheckState = 'pass' | 'fail' | 'pending'

export interface Check {
  id: 'pool' | 'oracle' | 'depth' | 'window'
  label: string
  detail: string
  value: string
  state: CheckState
}
