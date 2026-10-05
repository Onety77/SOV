import type { Snapshot } from '@/components/intro/Ticket'
import { createStore } from '@/lib/store'

/*
  The way in. Pressing Enter hands the ticket's snapshot to <Warp>, which turns it into
  particles, spins them into a vortex, navigates while the screen is covered, and dives
  through the ring into the markets. Pages that arrive this way wait for `reveal` before
  playing their entrance.
*/

type Phase = 'idle' | 'out' | 'reveal'

export const warp = createStore<{ phase: Phase; snap: Snapshot | null; run: number }>({ phase: 'idle', snap: null, run: 0 })

export const startWarp = (snap: Snapshot | null) => {
  // dev only: lets the frame tests render the particles from the same snapshot
  if (import.meta.env.DEV) (window as unknown as { __snap?: Snapshot | null }).__snap = snap
  warp.set((w) => (w.phase === 'idle' ? { phase: 'out', snap, run: w.run + 1 } : w))
}

/** False while the screen is still covered by the transition. */
export const useArrived = () => warp.use().phase !== 'out'

/** Seconds into the transition when each thing happens. */
export const T = { navigate: 0.95, reveal: 1.6, end: 2.5 } as const
