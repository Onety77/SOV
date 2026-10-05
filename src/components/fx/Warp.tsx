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
  const glow = useRef<HTMLDivElement>(null)
  const core = useRef<HTMLDivElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const plain = Boolean(reduced) || !snap

  useEffect(() => {
    // a fresh canvas per run: a released WebGL context can't be used again
    const c = document.createElement('canvas')
    c.className = 'absolute inset-0 size-full'
    if (!plain) stage.current?.appendChild(c)
    const particles = !plain && snap ? createParticles(c, snap) : null
    const beats = particles ? BEATS : { navigate: 0.3, reveal: 0.35, open: 99, end: 0.75 }
    if (import.meta.env.DEV) (window as unknown as { __warpMode?: string }).__warpMode = particles ? 'particles' : plain ? 'plain' : 'no-webgl'
    // a test hook slows the whole thing down so single frames can be inspected
    const speed = (window as unknown as { __warpSpeed?: number }).__warpSpeed ?? 1
    const far = Math.hypot(window.innerWidth, window.innerHeight) / 2 + 160
    let raf = 0
    const t0 = performance.now()
    let navigated = false
    let revealed = false
    const set = (el: HTMLDivElement | null, opacity: number, scale?: number) => {
      if (!el) return
      el.style.opacity = String(opacity)
      if (scale !== undefined) el.style.transform = `translate(-50%, -50%) scale(${scale})`
    }
    const frame = (now: number) => {
      const t = ((now - t0) / 1000) * speed
      particles?.draw(t)
      const g = ground.current
      if (g) {
        if (!particles) g.style.opacity = String(kf(t, [[0, 0], [0.25, 1], [0.4, 1], [0.75, 0]]))
        else {
          // the ground closes over the intro, then a hole opens from the centre of the light
          g.style.opacity = String(kf(t, [[0, 0], [0.15, 0], [0.75, 1]]))
          if (t >= beats.open) {
            const k = Math.min(1, (t - beats.open) / (beats.end - beats.open - 0.05))
            const r = far * (1 - (1 - k) ** 3)
            const mask = `radial-gradient(circle at 50% 50%, transparent ${r}px, rgb(0 0 0 / 0.55) ${r + 70}px, #000 ${r + 160}px)`
            g.style.maskImage = mask
            g.style.setProperty('-webkit-mask-image', mask)
          }
        }
      }
      set(glow.current, kf(t, [[0, 0], [0.9, 0.45], [1.85, 1], [2.2, 0]]), kf(t, [[0, 0.5], [1.85, 1.15], [2.25, 3]]))
      set(core.current, kf(t, [[1.05, 0], [1.9, 0.9], [2.02, 1], [2.25, 0]]), kf(t, [[1.05, 0.25], [1.95, 1], [2.25, 5]]))
      set(flash.current, kf(t, [[1.92, 0], [2.02, 0.7], [2.45, 0]]))
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
      {!plain && (
        <>
          {/* the vortex's glow, building as it spins */}
          <div ref={glow} className="absolute top-1/2 left-1/2 size-[90vmin] rounded-full bg-[radial-gradient(closest-side,rgb(139_92_246/0.42),rgb(139_92_246/0.1)_55%,transparent)] opacity-0" />
          <div ref={stage} className="absolute inset-0" />
          {/* the core gathering at the centre, then the flash as we pass through */}
          <div ref={core} className="absolute top-1/2 left-1/2 size-[28vmin] rounded-full bg-[radial-gradient(closest-side,rgb(245_242_255/0.95),rgb(169_139_255/0.5)_45%,transparent)] opacity-0 mix-blend-screen" />
          <div ref={flash} className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgb(232_224_255/0.6),rgb(139_92_246/0.18)_40%,transparent_72%)] opacity-0" />
        </>
      )}
    </div>
  )
}
