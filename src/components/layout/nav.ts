import { LayoutGrid, Route, ShieldCheck } from 'lucide-react'

export const nav = [
  { to: '/markets', label: 'Markets', hint: 'Every coin and the stage it is in', icon: LayoutGrid },
  { to: '/lifecycle', label: 'Lifecycle', hint: 'Curve, spot, readiness, perps', icon: Route },
  { to: '/readiness', label: 'Readiness', hint: 'The four checks, live for every coin', icon: ShieldCheck },
]
