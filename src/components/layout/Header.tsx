import { Link, NavLink } from 'react-router-dom'
import { m } from 'motion/react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SPRING_UI } from '@/lib/motion'
import { toggleWallet, wallet } from '@/lib/session'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { SearchBox } from '@/components/search/SearchBox'
import { SearchSheet } from '@/components/search/SearchSheet'
import { MobileMenu } from './MobileMenu'
import { nav } from './nav'

export function Header() {
  const address = wallet.use()
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] backdrop-blur-xl">
      <div className="wrap flex h-14 items-center gap-3 lg:h-16 lg:gap-6">
        <Link to="/markets" aria-label="SOV markets" className="shrink-0 rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-0.5 rounded-[12px] p-1 ring-1 ring-line ring-inset">
            {nav.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  className={({ isActive }) => cn('relative flex h-8 items-center gap-2 rounded-[9px] px-3 text-[13.5px] font-medium transition-colors', isActive ? 'text-ink' : 'text-ink-3 hover-device:hover:text-ink')}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <m.span layoutId="nav-pill" className="absolute inset-0 rounded-[9px] bg-raised" transition={SPRING_UI} />}
                      <n.icon className={cn('relative size-4', isActive && 'text-accent-text')} />
                      <span className="relative">{n.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <SearchBox className="ml-auto hidden w-60 md:block xl:w-72" />
        <div className="flex items-center gap-1.5 max-md:ml-auto sm:gap-2">
          <SearchSheet className="grid size-9 place-items-center rounded-control bg-raised text-ink-2 md:hidden" />
          <Button variant="secondary" onClick={toggleWallet} className="max-sm:h-9 max-sm:px-3 max-sm:text-[13px]">
            {address ? (
              <span className="flex items-center gap-2 font-mono text-[13px]">
                <span aria-hidden className="size-1.5 rounded-full bg-up" />
                {address}
              </span>
            ) : (
              'Connect'
            )}
          </Button>
          <Button variant="primary" to="/launch" className="max-lg:hidden">
            <Plus className="size-4" strokeWidth={2.5} />
            Create a launch
          </Button>
          <MobileMenu className="lg:hidden" />
        </div>
      </div>
    </header>
  )
}
