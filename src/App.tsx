import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LazyMotion, MotionConfig, domMax } from 'motion/react'
import { Shell } from '@/components/layout/Shell'
import { Warp } from '@/components/fx/Warp'
import { Intro } from '@/pages/Intro'
import { Markets } from '@/pages/Markets'
import { Market } from '@/pages/Market'
import { Lifecycle } from '@/pages/Lifecycle'
import { Readiness } from '@/pages/Readiness'
import { Launch } from '@/pages/Launch'
import { NotFound } from '@/pages/NotFound'

export default function App() {
  return (
    <LazyMotion features={domMax} strict>
      {/* reduced motion: transforms drop, fades stay; loops check useReducedMotion() themselves */}
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Routes>
            <Route index element={<Intro />} />
            <Route element={<Shell />}>
              <Route path="markets" element={<Markets />} />
              <Route path="markets/:id" element={<Market />} />
              <Route path="lifecycle" element={<Lifecycle />} />
              <Route path="readiness" element={<Readiness />} />
              <Route path="launch" element={<Launch />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Warp />
        </BrowserRouter>
      </MotionConfig>
    </LazyMotion>
  )
}
