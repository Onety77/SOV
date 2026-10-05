import { Fragment, useEffect, useRef, useState } from 'react'
import { m } from 'motion/react'
import { ArrowRight, Droplets, ShieldCheck, Sprout, Zap } from 'lucide-react'
import { EASE_OUT } from '@/lib/motion'
import { useTitle } from '@/lib/useTitle'
import { Logo } from '@/components/ui/Logo'
import { Ticket, type TicketHandle } from '@/components/intro/Ticket'
import { startWarp, warp } from '@/components/fx/warp'

const flow = [
  { label: 'Bonding Curve', icon: Sprout },
  { label: 'PumpSwap Spot', icon: Droplets },
  { label: 'Readiness Gates', icon: ShieldCheck },
  { label: '2x Perps', icon: Zap },
]

/**
 * The front door: a launch-access ticket printing itself in, the four stages a coin moves
 * through, and one way in. Enter (the button or the key) dissolves the ticket into the
 * vortex that carries you into the markets.
 */
export function Intro() {
  useTitle()
  const ticket = useRef<TicketHandle>(null)
  const { phase } = warp.use()
  const leaving = phase !== 'idle'
  const [gone, setGone] = useState(false)

  const enter = () => {
    if (warp.get().phase !== 'idle') return
    startWarp(ticket.current?.snapshot() ?? null)
  }

  // the particles draw on the next frame; hide the real ticket only once they're there
  useEffect(() => {
    if (phase !== 'out') return
    let b = 0
    const a = requestAnimationFrame(() => (b = requestAnimationFrame(() => setGone(true))))
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
    }
  }, [phase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key !== 'Enter' || e.repeat || /^(button|a|input|textarea|select)$/i.test(t.tagName)) return
      e.preventDefault()
      if (warp.get().phase !== 'idle') return
      startWarp(ticket.current?.snapshot() ?? null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const chrome = (delay: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: leaving ? { opacity: 0, transition: { duration: 0.35, ease: EASE_OUT } } : { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE_OUT },
  })

  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-hidden">
      {/* drafting grid and the light the ticket sits in */}
      {/* the drafting grid behind everything */}
      <m.div
        aria-hidden
        className="grid-paper absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: leaving ? 0.45 : 1.2 }}
      />
      <m.div
        aria-hidden
        className="absolute top-[46%] left-1/2 -z-10 size-[min(1100px,160vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(124_77_255/0.22),rgb(124_77_255/0.06)_50%,transparent)]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: leaving ? 0 : 1, scale: 1 }}
        transition={{ duration: 1.8, ease: EASE_OUT }}
      />

      <m.header className="wrap flex items-center justify-between gap-4 pt-[max(20px,env(safe-area-inset-top))]" {...chrome(0.05)}>
        <Logo />
        <span className="rounded-full px-3.5 py-1.5 font-mono text-[11px] tracking-[0.22em] text-ink-2 uppercase ring-1 ring-line-2 ring-inset">Concept preview</span>
      </m.header>

      <main className="wrap flex flex-1 flex-col items-center justify-center py-8 sm:py-10">
        <m.p
          className="eyebrow text-center text-[11px] sm:text-[13px]"
          initial={{ opacity: 0, letterSpacing: '0.42em' }}
          animate={leaving ? { opacity: 0 } : { opacity: 1, letterSpacing: '0.2em' }}
          transition={{ duration: 1.4, delay: 0.15, ease: EASE_OUT }}
        >
          Coin-backed perpetual markets on Solana
        </m.p>

        <m.div
          className="mt-7 w-full max-w-[640px] sm:mt-10"
          initial={{ opacity: 0, y: 48, rotateX: 32, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: 1.3, delay: 0.25, ease: EASE_OUT }}
          style={{ transformPerspective: 1200 }}
        >
          <Ticket ref={ticket} delay={0.35} gone={gone} />
        </m.div>

        <ol aria-label="How a coin earns leverage" className="mt-8 flex max-w-[520px] flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:mt-10 sm:max-w-none">
          {flow.map((f, i) => (
            <Fragment key={f.label}>
              <m.li
                className="flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium text-ink-2 ring-1 ring-line-2 ring-inset"
                initial={{ opacity: 0, y: 10 }}
                animate={leaving ? { opacity: 0, transition: { duration: 0.3 } } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.0 + i * 0.09, ease: EASE_OUT }}
              >
                <f.icon className="size-4 text-accent-text" />
                {f.label}
              </m.li>
              {i < flow.length - 1 && (
                <m.li aria-hidden className="text-ink-3" initial={{ opacity: 0 }} animate={{ opacity: leaving ? 0 : 1 }} transition={{ duration: 0.6, delay: 1.1 + i * 0.09 }}>
                  <ArrowRight className="run size-4" style={{ animationDelay: `${1.8 + i * 0.5}s` }} />
                </m.li>
              )}
            </Fragment>
          ))}
        </ol>

        <m.div className="mt-9 flex flex-col items-center gap-3 sm:mt-11" {...chrome(1.4)}>
          <button
            type="button"
            onClick={enter}
            className="group sheen relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-[14px] bg-accent-strong px-8 text-[17px] font-semibold text-on-accent shadow-[0_0_0_1px_rgb(255_255_255/0.1)_inset,0_14px_50px_-12px_rgb(124_77_255/0.85)] transition-[box-shadow,scale] duration-200 active:scale-[0.98] hover-device:hover:shadow-[0_0_0_1px_rgb(255_255_255/0.18)_inset,0_18px_60px_-10px_rgb(124_77_255/1)]"
          >
            Enter Markets
            <ArrowRight className="size-5 transition-transform duration-300 hover-device:group-hover:translate-x-1" />
          </button>
          <p className="flex items-center gap-2 text-[14px] text-ink-3 max-[1023px]:[@media(hover:none)]:hidden">
            or press <kbd className="rounded-[7px] px-2 py-0.5 text-[13px] text-ink-2 ring-1 ring-line-2">Enter</kbd>
          </p>
        </m.div>
      </main>

      <m.footer className="wrap pb-[max(20px,env(safe-area-inset-bottom))] text-center text-[12.5px] leading-relaxed text-ink-3" {...chrome(1.6)}>
        Interface concept only. No wallet connection, live data, audit claim, or production-readiness claim.
      </m.footer>
    </div>
  )
}
