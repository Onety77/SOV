import { cloneElement, type ReactElement } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { EASE_OUT } from '@/lib/motion'
import { useMedia } from '@/lib/useMedia'
import { useTitle } from '@/lib/useTitle'
import { Board } from '@/components/board/Board'

/** Which sheet a path opens over the board, if any. Switching coins keeps the same sheet. */
const sheetFor = (path: string) => (path.startsWith('/markets/') ? 'coin' : path === '/launch' ? 'launch' : path === '/how' ? 'how' : null)

/** The board never unmounts; coins, the launch composer and the explainer open over it. */
export function BoardPage() {
  useTitle('Markets')
  const { pathname } = useLocation()
  const outlet = useOutlet()
  const kind = sheetFor(pathname)
  const wide = useMedia('(min-width: 768px)')
  // a sheet is in front: the board steps back. On phones it recedes like a card in a stack;
  // on wide screens it only eases back a touch, since it stays readable beside the panel.
  const back = kind ? (wide ? { scale: 0.985 } : { scale: 0.94, borderRadius: 22 }) : { scale: 1, borderRadius: 0 }
  return (
    <>
      <m.div
        initial={false}
        animate={back}
        transition={{ duration: kind ? 0.5 : 0.4, ease: EASE_OUT }}
        style={{ transformOrigin: `50% ${typeof window === 'undefined' ? 0 : window.scrollY + window.innerHeight * 0.4}px` }}
        className={kind && !wide ? 'overflow-hidden' : undefined}
        // behind an open sheet the board is scenery: not focusable, not read out
        inert={Boolean(kind)}
      >
        <Board />
      </m.div>
      <AnimatePresence>{kind && outlet && cloneElement(outlet as ReactElement, { key: kind })}</AnimatePresence>
    </>
  )
}
