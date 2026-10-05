import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LazyMotion, MotionConfig, domMax } from 'motion/react'
import { Shell } from '@/components/layout/Shell'
import { Warp } from '@/components/fx/Warp'
import { Intro } from '@/pages/Intro'
import { BoardPage } from '@/pages/BoardPage'
import { NotFound } from '@/pages/NotFound'
import { CoinSheet } from '@/components/sheets/CoinSheet'
import { LaunchSheet } from '@/components/sheets/LaunchSheet'
import { HowSheet } from '@/components/sheets/HowSheet'

export default function App() {
  return (
    <LazyMotion features={domMax} strict>
      {/* reduced motion: transforms drop, fades stay; loops check useReducedMotion() themselves */}
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Routes>
            <Route index element={<Intro />} />
            <Route element={<Shell />}>
              <Route element={<BoardPage />}>
                <Route path="markets" element={null} />
                <Route path="markets/:id" element={<CoinSheet />} />
                <Route path="launch" element={<LaunchSheet />} />
                <Route path="how" element={<HowSheet />} />
              </Route>
              <Route path="lifecycle" element={<Navigate to="/how" replace />} />
              <Route path="readiness" element={<Navigate to="/how" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Warp />
        </BrowserRouter>
      </MotionConfig>
    </LazyMotion>
  )
}
