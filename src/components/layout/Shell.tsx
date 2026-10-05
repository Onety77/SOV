import { Outlet } from 'react-router-dom'
import { m } from 'motion/react'
import { EASE_OUT } from '@/lib/motion'
import { warp } from '@/components/fx/warp'
import { TopBar } from '@/components/shell/TopBar'
import { Palette } from '@/components/shell/Palette'
import { usePaletteKeys } from '@/components/shell/usePaletteKeys'

export function Shell() {
  usePaletteKeys()
  // arriving through the vortex: the page waits out of focus behind the light, then
  // settles into place as the light opens
  const covered = warp.use().phase === 'out'
  return (
    <>
      <TopBar />
      <m.main
        id="content"
        className="flex-1 origin-[50%_30vh]"
        initial={false}
        animate={covered ? { scale: 1.06, filter: 'blur(6px)', opacity: 0.6 } : { scale: 1, filter: 'blur(0px)', opacity: 1, transitionEnd: { filter: 'none' } }}
        transition={{ duration: 1.1, ease: EASE_OUT }}
      >
        <Outlet />
      </m.main>
      <Palette />
    </>
  )
}
