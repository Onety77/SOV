import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { cn } from '@/lib/cn'
import { cellFor, createTexture, shape } from './ticketTexture'
import { createTicketGL } from './ticketGL'

export interface Snapshot {
  /** the ticket at one pixel per cell, text included */
  canvas: HTMLCanvasElement
  rect: DOMRect
  cell: number
  cuts: [number, number, number][]
}

export interface TicketHandle {
  snapshot: () => Snapshot | null
}

interface Props {
  /** seconds before the ticket prints itself in */
  delay?: number
  /** stop animating and hold still (the particles have taken over) */
  gone?: boolean
  className?: string
}

/**
 * The launch-access ticket: a violet stub with living grain, a perforated tear-off reading
 * ADMIT ONE, and a slight 3D tilt toward the pointer. Its snapshot seeds the particles.
 */
export const Ticket = forwardRef<TicketHandle, Props>(function Ticket({ delay = 0, gone = false, className }, ref) {
  const box = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  /** reads the current frame at one pixel per grain, for the snapshot */
  const grab = useRef<(() => { w: number; h: number; data: Uint8ClampedArray<ArrayBuffer> }) | null>(null)
  /** pointer in grain units, and whether it's over the ticket */
  const ptr = useRef({ x: 0, y: 0, on: false })
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const reduced = useReducedMotion()

  // pointer tilt (hover devices only)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rx = useSpring(useTransform(py, (v) => v * -7), { stiffness: 140, damping: 18 })
  const ry = useSpring(useTransform(px, (v) => v * 9), { stiffness: 140, damping: 18 })
  const sheenX = useTransform(px, (v) => `${50 + v * 60}%`)
  const sheenY = useTransform(py, (v) => `${50 + v * 60}%`)
  const sheen = useTransform([sheenX, sheenY], ([x, y]) => `radial-gradient(60% 80% at ${x} ${y}, rgb(255 255 255 / 0.35), transparent 70%)`)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width)
      const h = Math.round(e.contentRect.height)
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // the living surface: the GPU shader, or the canvas renderer where WebGL isn't available
  useEffect(() => {
    const host = surface.current
    if (!host || !size) return
    // a fresh canvas per run: a released WebGL context can't be used again
    const c = document.createElement('canvas')
    c.setAttribute('aria-hidden', 'true')
    c.className = 'absolute inset-0 size-full [image-rendering:pixelated]'
    host.appendChild(c)
    const cell = cellFor(size.w)
    const cw = Math.ceil(size.w / cell)
    const ch = Math.ceil(size.h / cell)
    const gl = createTicketGL(c, cw, ch)
    if (import.meta.env.DEV) (window as unknown as { __ticketMode?: string }).__ticketMode = gl ? 'gpu' : 'canvas'
    let draw: (t: number, reveal: number, lens: number) => void
    if (gl) {
      draw = (t, reveal, lens) => gl.draw(t, reveal, [ptr.current.x / cell, ptr.current.y / cell, lens])
      grab.current = () => ({ w: cw, h: ch, data: new Uint8ClampedArray(gl.pixels().buffer) })
    } else {
      c.width = cw
      c.height = ch
      const ctx = c.getContext('2d')
      if (!ctx) {
        c.remove()
        return
      }
      const tex = createTexture(cw, ch)
      draw = (t, reveal) => ctx.putImageData(tex.render(t, reveal), 0, 0)
      grab.current = () => ({ w: cw, h: ch, data: tex.image.data })
    }
    if (reduced) {
      draw(12, 1, 0)
      return () => {
        gl?.dispose()
        c.remove()
      }
    }
    const start = performance.now()
    let raf = 0
    let last = 0
    let lens = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      // the canvas fallback is heavier; 30fps is plenty for grain drawn on the CPU
      if (document.hidden || gone || (!gl && now - last < 33)) return
      last = now
      const s = (now - start) / 1000
      const k = Math.min(1, Math.max(0, (s - delay) / 1.4))
      lens += ((ptr.current.on ? 1 : 0) - lens) * 0.08
      draw(s + 12, 1 - (1 - k) ** 3, lens)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      gl?.dispose()
      c.remove()
    }
  }, [size, reduced, gone, delay])

  useImperativeHandle(ref, () => ({
    snapshot: () => {
      const el = box.current
      const frame = grab.current?.()
      if (!el || !frame || !size) return null
      px.jump(0)
      py.jump(0)
      rx.jump(0)
      ry.jump(0)
      const rect = el.getBoundingClientRect()
      const cell = cellFor(size.w)
      const out = document.createElement('canvas')
      out.width = frame.w
      out.height = frame.h
      const ctx = out.getContext('2d')!
      ctx.putImageData(new ImageData(frame.data, frame.w, frame.h), 0, 0)
      ctx.scale(1 / cell, 1 / cell)
      ctx.textBaseline = 'middle'
      el.querySelectorAll<HTMLElement>('[data-snap]').forEach((n) => {
        const r = n.getBoundingClientRect()
        const cs = getComputedStyle(n)
        ctx.save()
        ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
        const c2 = ctx as CanvasRenderingContext2D & { letterSpacing?: string; fontStretch?: string }
        if ('letterSpacing' in ctx) c2.letterSpacing = cs.letterSpacing
        if ('fontStretch' in ctx && parseFloat(cs.fontStretch) > 110) c2.fontStretch = 'expanded'
        ctx.fillStyle = cs.color
        const cx = r.left - rect.left + r.width / 2
        const cy = r.top - rect.top + r.height / 2
        ctx.translate(cx, cy)
        if (n.dataset.snap === 'vertical') ctx.rotate(Math.PI / 2)
        ctx.textAlign = 'center'
        ctx.fillText(cs.textTransform === 'uppercase' ? (n.textContent ?? '').toUpperCase() : (n.textContent ?? ''), 0, 0)
        ctx.restore()
      })
      return { canvas: out, rect, cell, cuts: shape(size.w, size.h).cuts }
    },
  }))

  const s = size ? shape(size.w, size.h) : null
  const mask = s ? s.cuts.map(([x, y, r]) => `radial-gradient(circle ${r}px at ${x}px ${y}px, #0000 ${r - 0.5}px, #000 ${r}px)`).join(', ') : undefined

  return (
    <div
      className={cn('[container-type:inline-size] [perspective:1100px]', className)}
      onPointerMove={(e) => {
        const r = box.current?.getBoundingClientRect()
        if (!r) return
        // the grain follows any pointer, finger included; the tilt is for a mouse only
        ptr.current = { x: e.clientX - r.left, y: e.clientY - r.top, on: e.pointerType === 'mouse' || e.buttons > 0 }
        if (e.pointerType !== 'mouse') return
        px.set((e.clientX - r.left) / r.width - 0.5)
        py.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onPointerDown={(e) => {
        const r = box.current?.getBoundingClientRect()
        if (r) ptr.current = { x: e.clientX - r.left, y: e.clientY - r.top, on: true }
      }}
      onPointerUp={(e) => {
        if (e.pointerType !== 'mouse') ptr.current.on = false
      }}
      onPointerCancel={() => {
        ptr.current.on = false
      }}
      onPointerLeave={() => {
        ptr.current.on = false
        px.set(0)
        py.set(0)
      }}
    >
      <m.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} className={cn('relative', gone && 'invisible')}>
        <div
          ref={box}
          className="relative aspect-[1.72] w-full overflow-hidden text-white select-none"
          style={mask ? { maskImage: mask, WebkitMaskImage: mask, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' } : { opacity: 0 }}
        >
          <div ref={surface} aria-hidden className="absolute inset-0" />
          {/* light catching the stock as it tilts */}
          <m.div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{ background: sheen }}
          />
          {/* perforation */}
          {s && <span aria-hidden className="absolute inset-y-[6%] border-l-[1.5px] border-dashed border-white/35" style={{ left: s.perfX }} />}

          <m.div
            className="absolute inset-y-0 left-0 flex w-[79%] flex-col justify-between p-[6.5%_7%_6%]"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: delay + 0.95, ease: [0.16, 1, 0.3, 1] }}
          >
            <p data-snap className="w-fit font-mono text-[clamp(8px,1.9cqw,12px)] tracking-[0.06em] text-white/80 uppercase">
              SOV markets // launch access
            </p>
            <div>
              <h1 className="font-display leading-[0.92] font-[820] tracking-[-0.02em] text-white uppercase [font-stretch:125%]" style={{ fontSize: 'clamp(26px, 7.4cqw, 54px)' }}>
                <span data-snap className="block w-fit">Spot</span>
                <span data-snap className="block w-fit">earns</span>
                <span data-snap className="block w-fit">leverage</span>
              </h1>
              <p data-snap className="mt-[5%] w-fit font-mono text-[clamp(7.5px,1.75cqw,11.5px)] tracking-[0.04em] whitespace-nowrap text-white/85 uppercase">
                Solana · curve → spot → prove → 2x perps
              </p>
            </div>
          </m.div>
          <m.div className="absolute inset-y-0 right-0 w-[21%]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: delay + 1.25 }}>
            <span data-snap="vertical" className="absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2 rotate-90 font-mono leading-none font-[750] tracking-[0.02em] whitespace-nowrap text-white uppercase" style={{ fontSize: 'clamp(22px, 6.4cqw, 46px)' }}>
              Admit one
            </span>
          </m.div>
        </div>
      </m.div>
    </div>
  )
})
