import { Link, useNavigate } from 'react-router-dom'
import { m } from 'motion/react'
import { EASE_OUT } from '@/lib/motion'
import { warp } from '@/components/fx/warp'
import { BookOpen, Plus, Search, Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'
import { palette, toggleWallet, wallet } from '@/lib/session'
import { Logo, LogoMark } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'

/**
 * One bar, no menu. Everything you'd look for in a nav lives in the command bar in the
 * middle; the only other things here are the two you reach for constantly: your wallet
 * and Create.
 */
export function TopBar() {
  const address = wallet.use()
  const navigate = useNavigate()
  const covered = warp.use().phase === 'out'
  return (
    <m.header
      className="sticky top-0 z-40 bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-xl"
      initial={false}
      animate={covered ? { y: -16, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: covered ? 0 : 0.25, ease: EASE_OUT }}
    >
      <a href="#content" className="sr-only z-50 rounded-control bg-accent-strong px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <div className="wrap flex h-14 items-center gap-2.5 sm:gap-4 lg:h-16">
        <Link to="/markets" aria-label="SOV markets, the board" className="shrink-0 rounded-md">
          <Logo className="max-sm:hidden" />
          <LogoMark className="sm:hidden" />
        </Link>

        <button
          type="button"
          onClick={() => palette.set(true)}
          aria-label="Search coins, stages and actions"
          className="group mx-auto flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-raised/80 pr-2 pl-3.5 text-left text-[14px] text-ink-3 ring-1 ring-line ring-inset transition-colors hover-device:hover:text-ink-2 hover-device:hover:ring-line-2 sm:max-w-[460px]"
        >
          <Search className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            <span className="sm:hidden">Search or jump</span>
            <span className="max-sm:hidden">Search coins, jump to a stage, or launch</span>
          </span>
          <kbd className="hidden rounded-full bg-surface px-2 py-0.5 font-mono text-[11px] text-ink-3 ring-1 ring-line sm:block">⌘K</kbd>
        </button>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" onClick={() => navigate('/how')} className="max-lg:hidden">
            <BookOpen className="size-4" />
            How it works
          </Button>
          <button
            type="button"
            onClick={toggleWallet}
            aria-label={address ? `Wallet ${address}, disconnect` : 'Connect wallet'}
            className={cn('flex h-10 items-center gap-2 rounded-full bg-raised px-3 text-[14px] font-semibold transition-colors hover-device:hover:bg-[#23222d]', !address && 'max-sm:w-10 max-sm:justify-center max-sm:px-0')}
          >
            {address ? (
              <>
                <span aria-hidden className="size-1.5 rounded-full bg-up" />
                <span className="font-mono text-[13px] font-medium">{address}</span>
              </>
            ) : (
              <>
                <Wallet className="size-4 sm:hidden" />
                <span className="max-sm:sr-only">Connect</span>
              </>
            )}
          </button>
          <Button variant="primary" to="/launch" className="h-10 rounded-full max-sm:w-10 max-sm:px-0" aria-label="Create a launch">
            <Plus className="size-4" strokeWidth={2.5} />
            <span className="max-sm:hidden">Create</span>
          </Button>
        </div>
      </div>
    </m.header>
  )
}
