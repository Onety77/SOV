import { createStore } from './store'
import type { Coin } from './types'
import { coins as sample } from '@/data/coins'
import { track } from './live'

/* What happens this visit: the wallet, and coins you launch. Nothing is sent anywhere. */

export const wallet = createStore<string | null>(null)
export const toggleWallet = () => wallet.set((a) => (a ? null : '7xKp…m3Qd'))

const coinStore = createStore<Coin[]>(sample)
export const useCoins = () => coinStore.use()
export const findCoin = (id: string) => coinStore.get().find((c) => c.id === id)

export function addCoin(c: Coin) {
  track(c)
  coinStore.set((all) => [c, ...all])
}
