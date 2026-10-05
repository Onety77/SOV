import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { m, useDragControls } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { EASE_OUT } from '@/lib/motion'
import { useMedia } from '@/lib/useMedia'

interface Props {
  label: string
  onClose: () => void
  /** pinned under the scrolling body: the trade bar, a submit button */
  footer?: ReactNode
  /** a header row above the scrolling body */
  head?: ReactNode
  width?: number
  children: ReactNode
}

/**
 * Things you open from the board slide over it instead of replacing it, so the board and
 * your place on it stay put. Wide screens: a panel from the right, the board still visible
 * beside it. Phones: a sheet from the bottom that you can drag down to close.
 */
export function Sheet({ label, onClose, footer, head, width = 620, children }: Props) {
  const wide = useMedia('(min-width: 768px)')
  const drag = useDragControls()
  const panel = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[data-palette]')) close.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      before?.focus?.({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-50">
      <m.div
        aria-hidden
        className="absolute inset-0 bg-[rgb(5_4_9/0.55)] backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        transition={{ duration: 0.3 }}
        onClick={() => close.current()}
      />
      <m.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          'absolute flex flex-col bg-surface shadow-[0_0_0_1px_var(--line-2),0_30px_80px_-20px_rgb(0_0_0/0.9)] outline-none',
          wide ? 'inset-y-2 right-2 rounded-[20px]' : 'inset-x-0 bottom-0 top-[max(12px,env(safe-area-inset-top,0px))] rounded-t-[22px]',
        )}
        style={wide ? { width: `min(${width}px, calc(100vw - 16px))` } : undefined}
        initial={wide ? { x: '104%' } : { y: '100%' }}
        animate={wide ? { x: 0 } : { y: 0 }}
        exit={wide ? { x: '104%', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } } : { y: '100%', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        drag={wide ? false : 'y'}
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.9 }}
        onDragEnd={(_, i) => {
          if (i.offset.y > 140 || i.velocity.y > 700) close.current()
        }}
      >
        {!wide && (
          <div className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1" onPointerDown={(e) => drag.start(e)}>
            <span aria-hidden className="h-1 w-10 rounded-full bg-line-2" />
          </div>
        )}
        <div className={cn('flex shrink-0 items-center gap-3 px-5 sm:px-6', wide ? 'pt-5 pb-4' : 'pt-2 pb-3')} onPointerDown={(e) => !wide && !(e.target as HTMLElement).closest('button, a, input') && drag.start(e)}>
          <div className="min-w-0 flex-1">{head}</div>
          <button type="button" onClick={() => close.current()} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full bg-raised text-ink-2 hover-device:hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 sm:px-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] sm:px-6">{footer}</div>}
      </m.div>
    </div>,
    document.body,
  )
}
