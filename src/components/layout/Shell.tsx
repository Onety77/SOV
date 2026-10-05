import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { m } from 'motion/react'
import { EASE_OUT } from '@/lib/motion'
import { warp } from '@/components/fx/warp'
import { Footer } from './Footer'
import { Header } from './Header'

export function Shell() {
  const { pathname, hash } = useLocation()

  // new page: top, unless the link points at a section
  useEffect(() => {
    const el = hash ? document.getElementById(hash.slice(1)) : null
    if (el) el.scrollIntoView({ block: 'start' })
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  // arriving through the vortex: the page is revealed by the transition, not faded
  const viaWarp = warp.get().phase !== 'idle'

  return (
    <>
      <a href="#main" className="sr-only z-50 rounded-control bg-accent-strong px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <m.div key={pathname} initial={viaWarp ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
          <Outlet />
        </m.div>
      </main>
      <Footer />
    </>
  )
}
