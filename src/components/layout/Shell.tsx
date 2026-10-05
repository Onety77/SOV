import { Outlet } from 'react-router-dom'
import { m } from 'motion/react'
import { EASE_OUT } from '@/lib/motion'
import { warp } from '@/components/fx/warp'
import { TopBar } from '@/components/shell/TopBar'
import { Palette } from '@/components/shell/Palette'
import { usePaletteKeys } from '@/components/shell/usePaletteKeys'

export function Shell() {
  usePaletteKeys()
  // arriving from the intro: the page waits behind the ground, then fades up once
  const covered = warp.use().phase === 'out'
  return (
    <>
      <TopBar />
      <m.main
        id="content"
        className="flex-1"
        initial={false}
        animate={covered ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        <Outlet />
      </m.main>
      <Palette />
    </>
  )
}
