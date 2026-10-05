import { cloneElement, type ReactElement } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
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
  return (
    <>
      <Board />
      <AnimatePresence>{kind && outlet && cloneElement(outlet as ReactElement, { key: kind })}</AnimatePresence>
    </>
  )
}
