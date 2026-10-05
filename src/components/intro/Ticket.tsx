import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { cn } from '@/lib/cn'
import { cellFor, createTexture, shape, type Texture } from './ticketTexture'

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
  const canvas = useRef<HTMLCanvasElement>(null)
  const tex = useRef<Texture | null>(null)
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

  // the living surface
  useEffect(() => {
    const c = canvas.current
    if (!c || !size) return
    const cell = cellFor(size.w)
    const cw = Math.ceil(size.w / cell)
    const ch = Math.ceil(size.h / cell)
    c.width = cw
    c.height = ch
    const ctx = c.getContext('2d')
    if (!ctx) return
    const t = createTexture(cw, ch)
    tex.current = t
    if (reduced) {
      ctx.putImageData(t.render(0, 1), 0, 0)
      return
    }
    if (gone) return
    const start = performance.now()
    let raf = 0
    let last = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 33 || document.hidden) return // ~30fps is plenty for grain
      last = now
      const s = (now - start) / 1000
      const reveal = Math.min(1, Math.max(0, (s - delay) / 1.1))
      ctx.putImageData(t.render(s + 40, reveal * reveal * (3 - 2 * reveal)), 0, 0)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [size, reduced, gone, delay])

  useImperativeHandle(ref, () => ({
    snapshot: () => {
      const el = box.current
      const t = tex.current
      if (!el || !t || !size) return null
      px.jump(0)
      py.jump(0)
      rx.jump(0)
      ry.jump(0)
      const rect = el.getBoundingClientRect()
      const cell = cellFor(size.w)
      const out = document.createElement('canvas')
      out.width = t.w
      out.height = t.h
      const ctx = out.getContext('2d')!
      ctx.putImageData(t.image, 0, 0)
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
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        px.set((e.clientX - r.left) / r.width - 0.5)
        py.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onPointerLeave={() => {
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
          <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full [image-rendering:pixelated]" />
          {/* light catching the stock as it tilts */}
          <m.div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{ background: sheen }}
          />
          {/* perforation */}
          {s && <span aria-hidden className="absolute inset-y-[6%] border-l-[1.5px] border-dashed border-white/35" style={{ left: s.perfX }} />}

          <div className="absolute inset-y-0 left-0 flex w-[79%] flex-col justify-between p-[6.5%_7%_6%]">
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
          </div>
          <div className="absolute inset-y-0 right-0 w-[21%]">
            <span data-snap="vertical" className="absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2 rotate-90 font-mono leading-none font-[750] tracking-[0.02em] whitespace-nowrap text-white uppercase" style={{ fontSize: 'clamp(22px, 6.4cqw, 46px)' }}>
              Admit one
            </span>
          </div>
        </div>
      </m.div>
    </div>
  )
})
