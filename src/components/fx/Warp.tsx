import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useReducedMotion } from 'motion/react'
import { T, warp } from './warp'
import { createParticles } from './particles'

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
  const canvas = useRef<HTMLCanvasElement>(null)
  const ground = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const plain = Boolean(reduced) || !snap

  useEffect(() => {
    const c = canvas.current
    const particles = !plain && c && snap ? createParticles(c, snap) : null
    const times = particles ? T : { navigate: 0.3, reveal: 0.35, end: 0.75 }
    // a test hook slows the whole thing down so single frames can be inspected
    const speed = (window as unknown as { __warpSpeed?: number }).__warpSpeed ?? 1
    let raf = 0
    const t0 = performance.now()
    let navigated = false
    let revealed = false
    const frame = (now: number) => {
      const t = ((now - t0) / 1000) * speed
      particles?.draw(t)
      if (ground.current)
        ground.current.style.opacity = String(particles ? kf(t, [[0, 0], [0.62, 1], [1.5, 1], [2.25, 0]]) : kf(t, [[0, 0], [0.25, 1], [0.4, 1], [0.75, 0]]))
      if (glow.current) {
        glow.current.style.opacity = String(kf(t, [[0, 0], [1.0, 0.9], [1.9, 1], [2.5, 0]]))
        glow.current.style.transform = `translate(-50%, -50%) scale(${kf(t, [[0, 0.4], [1.0, 0.9], [1.9, 2.6], [2.5, 3.2]])})`
      }
      if (flash.current) flash.current.style.opacity = String(kf(t, [[0, 0], [1.72, 0], [1.95, 0.8], [2.4, 0]]))
      if (!navigated && t >= times.navigate) {
        navigated = true
        navigate('/markets')
      }
      if (!revealed && t >= times.reveal) {
        revealed = true
        warp.set((w) => ({ ...w, phase: 'reveal' }))
      }
      if (t >= times.end) {
        warp.set((w) => ({ ...w, phase: 'idle', snap: null }))
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      particles?.dispose()
    }
  }, [plain, snap, navigate])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      {/* the ground closes over the intro, holds while we navigate, then opens onto the markets */}
      <div ref={ground} className="absolute inset-0 bg-bg opacity-0" />
      {!plain && (
        <>
          {/* the vortex's glow, then a flash as we pass through */}
          <div
            ref={glow}
            className="absolute top-1/2 left-1/2 size-[90vmin] rounded-full bg-[radial-gradient(closest-side,rgb(139_92_246/0.45),rgb(139_92_246/0.12)_55%,transparent)] opacity-0"
          />
          <canvas ref={canvas} className="absolute inset-0 size-full" />
          <div ref={flash} className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgb(220_208_255/0.5),rgb(139_92_246/0.15)_40%,transparent_70%)] opacity-0" />
        </>
      )}
    </div>
  )
}
