import { Outlet } from 'react-router-dom'
import { TopBar } from '@/components/shell/TopBar'
import { Palette } from '@/components/shell/Palette'
import { usePaletteKeys } from '@/components/shell/usePaletteKeys'

export function Shell() {
  usePaletteKeys()
  return (
    <>
      <TopBar />
      <main id="content" className="flex-1">
        <Outlet />
      </main>
      <Palette />
    </>
  )
}
