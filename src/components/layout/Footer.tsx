import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { nav } from './nav'

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="wrap flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <Link to="/" aria-label="Replay the intro" className="w-fit rounded-md">
            <Logo />
          </Link>
          <p className="max-w-md text-[12px] leading-relaxed text-ink-3">Interface concept only. No wallet connection, live data, audit claim or production-readiness claim. Coins shown are fictional.</p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-2">
          {[...nav, { to: '/launch', label: 'Create a launch' }].map((n) => (
            <li key={n.to}>
              <Link to={n.to} className="hover-device:hover:text-ink">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
