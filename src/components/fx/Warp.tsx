import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useReducedMotion } from 'motion/react'
import { warp } from './warp'
import { BEATS, createParticles } from './particles'

/** The full-screen layer that carries you from the intro into the markets. */
export function Warp() {
  const { phase, snap, run } = warp.use()
  if (phase === 'idle') return null
  return createPortal(<Layer key={run} snap={snap} />, document.body)
}

/** Piecewise keyframes with eased segments: kf(t, [[0, 0], [0.6, 1], [1.5, 1], [2.2, 0]]) */
function kf(t: number, frames: [number, number][]) {
  if (t <= frames[0][0]) return frames[0][1]
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1] = frames[i]
    const [t0, v0] = frames[i - 1]
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0 || 1)
      return v0 + (v1 - v0) * k * k * (3 - 2 * k)
    }
  }
  return frames[frames.length - 1][1]
}

function Layer({ snap }: { snap: ReturnType<typeof warp.get>['snap'] }) {
  const stage = useRef<HTMLDivElement>(null)
  const ground = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const plain = Boolean(reduced) || !snap

  useEffect(() => {
    // a fresh canvas per run: a released WebGL context can't be used again
    const c = document.createElement('canvas')
    c.className = 'absolute inset-0 size-full'
    if (!plain) stage.current?.appendChild(c)
    const particles = !plain && snap ? createParticles(c, snap) : null
    const beats = particles ? BEATS : { navigate: 0.3, reveal: 0.35, end: 0.75 }
    // a test hook slows the whole thing down so single frames can be inspected
    const speed = (window as unknown as { __warpSpeed?: number }).__warpSpeed ?? 1
    let raf = 0
    const t0 = performance.now()
    let navigated = false
    let revealed = false
    const frame = (now: number) => {
      const t = ((now - t0) / 1000) * speed
      particles?.draw(t)
      // the ground settles over the intro while the ticket dissolves, then lifts off the board
      if (ground.current)
        ground.current.style.opacity = String(particles ? kf(t, [[0, 0], [0.45, 1], [0.6, 1], [1.15, 0]]) : kf(t, [[0, 0], [0.25, 1], [0.4, 1], [0.75, 0]]))
      if (!navigated && t >= beats.navigate) {
        navigated = true
        navigate('/markets')
      }
      if (!revealed && t >= beats.reveal) {
        revealed = true
        warp.set((w) => ({ ...w, phase: 'reveal' }))
      }
      if (t >= beats.end) {
        warp.set((w) => ({ ...w, phase: 'idle', snap: null }))
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      particles?.dispose()
      c.remove()
    }
  }, [plain, snap, navigate])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <div ref={ground} className="absolute inset-0 bg-bg opacity-0" />
      <div ref={stage} className="absolute inset-0" />
    </div>
  )
}
