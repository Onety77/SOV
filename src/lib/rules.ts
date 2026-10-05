/* The rules a coin moves through. One place, so every page states the same numbers. */

/** SOL a bonding curve raises before it graduates into PumpSwap */
export const CURVE_TARGET_SOL = 85
/** oracle price must be newer than this */
export const ORACLE_MAX_AGE_S = 15
/** and within this much of the pool price */
export const MAX_DEVIATION_PCT = 1.5
/** canonical pool liquidity needed before leverage */
export const MIN_DEPTH_USD = 20_000
/** all checks must hold this long, unbroken */
export const WINDOW_H = 24
/** perps open at this leverage */
export const INITIAL_LEVERAGE = 2
export const SOL_USD = 162
export const TRADE_FEE_PCT = 1
