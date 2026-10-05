import { createStore } from './store'
import type { Coin, Stage } from './types'
import { coins as sample } from '@/data/coins'
import { track } from './live'

/* What happens this visit: the wallet, coins you launch, and a few UI requests shared
   across the app (open the command bar, bring a stage column into view). Nothing is sent anywhere. */

export const wallet = createStore<string | null>(null)
export const toggleWallet = () => wallet.set((a) => (a ? null : '7xKp…m3Qd'))

const coinStore = createStore<Coin[]>(sample)
export const useCoins = () => coinStore.use()
export const findCoin = (id: string) => coinStore.get().find((c) => c.id === id)

/** the coin you just launched, so the board can mark where it landed */
export const landed = createStore<string | null>(null)

export function addCoin(c: Coin) {
  track(c)
  coinStore.set((all) => [c, ...all])
  landed.set(c.id)
}

export const palette = createStore(false)

/** ask the board to bring a stage's column into view */
export const focusStage = createStore<{ stage: Stage; at: number } | null>(null)
export const showStage = (stage: Stage) => focusStage.set({ stage, at: Date.now() })
