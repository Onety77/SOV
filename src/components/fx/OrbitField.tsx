import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'

/**
 * The vortex at rest: a few hundred particles on a tilted ring, turning slowly behind the
 * hero. Same shape the transition dived through, so arriving feels continuous. Pauses
 * when off screen or the tab is hidden; a still frame under reduced motion.
 */
export function OrbitField({ className, tilt = 1.12 }: { className?: string; tilt?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const N = 520
    const pts = Array.from({ length: N }, () => ({ a: Math.random() * Math.PI * 2, r: 0.72 + Math.random() * 0.34, y: (Math.random() - 0.5) * 0.08, s: 0.6 + Math.random() * 0.8, w: Math.random() }))
    let raf = 0
    let visible = true
    let W = 0
    let H = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      W = c.clientWidth
      H = c.clientHeight
      c.width = W * dpr
      c.height = H * dpr
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(c)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(c)
    const ct = Math.cos(tilt)
    const st = Math.sin(tilt)
    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const R = Math.min(W, H) * 0.42
      const D = 900
      for (const p of pts) {
        const a = p.a + t * 0.06 * p.s
        const x = Math.cos(a) * p.r * R
        const z0 = Math.sin(a) * p.r * R
        const y0 = p.y * R
        const y = y0 * ct - z0 * st
        const z = y0 * st + z0 * ct
        const k = D / (D - z)
        const front = (z / R + 1) / 2
        ctx.globalAlpha = 0.15 + front * 0.6
        ctx.fillStyle = p.w > 0.85 ? '#d9ccff' : '#8b5cf6'
        const sz = (0.8 + p.w * 1.2) * k
        ctx.fillRect(W / 2 + x * k - sz / 2, H / 2 + y * k - sz / 2, sz, sz)
      }
    }
    if (reduced) {
      draw(0)
    } else {
      const t0 = performance.now()
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop)
        if (!visible || document.hidden) return
        draw((now - t0) / 1000)
      }
      raf = requestAnimationFrame(loop)
    }
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [reduced, tilt])

  return <canvas ref={ref} aria-hidden className={cn('pointer-events-none', className)} />
}
