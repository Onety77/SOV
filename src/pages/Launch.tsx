import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'
import type { Coin } from '@/lib/types'
import { cn } from '@/lib/cn'
import { EASE_OUT, EASE_UI } from '@/lib/motion'
import { sol } from '@/lib/format'
import { stages } from '@/lib/lifecycle'
import { CURVE_TARGET_SOL, INITIAL_LEVERAGE, SOL_USD } from '@/lib/rules'
import { addCoin, findCoin, toggleWallet, wallet } from '@/lib/session'
import { useTitle } from '@/lib/useTitle'
import { Button } from '@/components/ui/Button'
import { Area, Field } from '@/components/ui/Field'
import { CoinMark } from '@/components/ui/CoinMark'
import { StageTag } from '@/components/ui/StageTag'

const hues = [265, 215, 172, 150, 95, 48, 22, 330]
const START_PRICE = 0.000028

export function Launch() {
  useTitle('Create a launch')
  const address = wallet.use()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [touchedSymbol, setTouchedSymbol] = useState(false)
  const [blurb, setBlurb] = useState('')
  const [hue, setHue] = useState(hues[0])
  const [buy, setBuy] = useState('')
  const [tried, setTried] = useState(false)
  const [state, setState] = useState<'idle' | 'pending' | 'done'>('idle')
  const [made, setMade] = useState<Coin | null>(null)

  const sym = (touchedSymbol ? symbol : name.replace(/[^a-z0-9]/gi, '').slice(0, 5)).toUpperCase()
  const raised = Math.min(CURVE_TARGET_SOL * 0.5, Number(buy) || 0)
  const errors = {
    name: name.trim().length < 2 ? 'Give it a name of at least 2 characters.' : null,
    symbol: !/^[A-Z0-9]{2,6}$/.test(sym) ? '2 to 6 letters or numbers.' : findCoin(sym.toLowerCase()) ? 'That ticker is taken.' : null,
    blurb: blurb.trim().length < 10 ? 'A sentence about it, at least 10 characters.' : null,
  }
  const valid = !errors.name && !errors.symbol && !errors.blurb

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (!address) return toggleWallet()
    if (!valid) return
    setState('pending')
    window.setTimeout(() => {
      const coin: Coin = {
        id: sym.toLowerCase(),
        symbol: sym,
        name: name.trim(),
        hue,
        blurb: blurb.trim(),
        creator: address,
        launchedAt: Date.now(),
        mine: true,
        price: START_PRICE * (1 + raised / 20),
        change24h: 0,
        supply: 100_000_000,
        volume24h: raised * SOL_USD,
        holders: raised ? 1 : 0,
        raisedSol: raised,
      }
      addCoin(coin)
      setMade(coin)
      setState('done')
    }, 1200)
  }

  const reset = () => {
    setName('')
    setSymbol('')
    setTouchedSymbol(false)
    setBlurb('')
    setBuy('')
    setTried(false)
    setState('idle')
    setMade(null)
  }

  const preview = { symbol: sym || 'NEW', hue }

  return (
    <div className="wrap pt-12 pb-24 sm:pt-16">
      <p className="eyebrow">Create a launch</p>
      <h1 className="mt-4 max-w-[640px] text-h1">Every coin starts on the curve.</h1>
      <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed text-ink-2">
        Name it, describe it, and it trades on a bonding curve right away. Spot and leverage are earned later, by the market, through the same gates as every other coin.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
        <AnimatePresence mode="wait" initial={false}>
          {state === 'done' && made ? (
            <m.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }} className="max-w-[560px]">
              <m.span className="grid size-12 place-items-center rounded-full bg-accent-strong text-on-accent" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
                <Check className="size-6" strokeWidth={3} />
              </m.span>
              <h2 className="mt-6 text-h1">${made.symbol} is live on its curve.</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
                It’s in the market monitor now. When it raises {CURVE_TARGET_SOL} SOL it graduates to PumpSwap spot, and readiness starts watching it from there.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="primary" size="lg" to={`/markets/${made.id}`}>
                  Open ${made.symbol} <ArrowRight className="size-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={reset}>
                  Launch another
                </Button>
              </div>
            </m.div>
          ) : (
            <m.form key="form" onSubmit={submit} noValidate className="grid max-w-[620px] gap-6" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: EASE_UI }}>
              <div className="grid gap-6 sm:grid-cols-[1fr_160px]">
                <Field label="Name" placeholder="Lantern" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} error={tried ? errors.name : null} />
                <Field
                  label="Ticker"
                  placeholder="LNTRN"
                  value={sym}
                  onChange={(e) => {
                    setTouchedSymbol(true)
                    setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
                  }}
                  error={tried ? errors.symbol : null}
                  className="[&_input]:font-mono [&_input]:uppercase"
                />
              </div>
              <Area label="What is it" rows={3} maxLength={160} placeholder="One or two sentences. What it is and who it’s for." value={blurb} onChange={(e) => setBlurb(e.target.value)} error={tried ? errors.blurb : null} hint={`${blurb.length}/160`} />
              <fieldset>
                <legend className="label">Colour</legend>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {hues.map((h) => (
                    <button
                      key={h}
                      type="button"
                      aria-label={`Hue ${h}`}
                      aria-pressed={hue === h}
                      onClick={() => setHue(h)}
                      className={cn('size-9 rounded-full ring-offset-2 ring-offset-bg transition-shadow', hue === h ? 'ring-2 ring-ink' : 'ring-0')}
                      style={{ background: `radial-gradient(circle at 30% 25%, oklch(0.55 0.13 ${h}), oklch(0.36 0.1 ${h}) 70%)` }}
                    />
                  ))}
                </div>
              </fieldset>
              <Field label="First buy (optional)" placeholder="0.0" inputMode="decimal" value={buy} onChange={(e) => setBuy(e.target.value.replace(/[^\d.]/g, ''))} hint={raised ? `About ${sol(raised)} of the ${CURVE_TARGET_SOL} SOL curve` : 'Buy in at the very bottom of your own curve.'} className="[&_input]:font-mono sm:max-w-[260px]" />
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button type="submit" variant="primary" size="lg" disabled={state === 'pending'} className="disabled:opacity-100">
                  {!address ? 'Connect wallet to launch' : state === 'pending' ? 'Confirm in wallet…' : `Launch $${sym || '…'}`}
                </Button>
                {tried && !valid && address && <p className="text-[13px] text-down">Fix the fields above first.</p>}
              </div>
            </m.form>
          )}
        </AnimatePresence>

        <aside className="self-start lg:sticky lg:top-24">
          <p className="label">Preview</p>
          <div className="mt-3 rounded-card bg-surface p-5 ring-1 ring-line ring-inset">
            <div className="flex items-start gap-3">
              <CoinMark coin={preview} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold">{(name.trim() || 'Your coin').toUpperCase()}</p>
                <p className="font-mono text-[12px] text-ink-3">${sym || 'TICKER'}</p>
              </div>
              <StageTag stage="curve" />
            </div>
            <p className="mt-4 line-clamp-3 min-h-[3lh] text-[14px] leading-relaxed text-ink-2">{blurb.trim() || 'Your description shows here.'}</p>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="label">Bonding curve</span>
              <span className="font-mono text-[12px] tabular">{Math.round((raised / CURVE_TARGET_SOL) * 100)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
              <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(raised / CURVE_TARGET_SOL) * 100}%` }} />
            </div>
          </div>
          <p className="label mt-8">Then</p>
          <ol className="mt-3 space-y-3">
            {stages.map((s) => (
              <li key={s.n} className="flex gap-3 text-[13px]">
                <span className="font-mono text-accent-text">{s.n}</span>
                <span className="text-ink-2">
                  <span className="font-semibold text-ink">{s.title}.</span> {s.rule}.
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[12px] leading-relaxed text-ink-3">Concept only: launching here adds the coin to this page for this visit. Perps open at {INITIAL_LEVERAGE}x, never at launch.</p>
          <Link to="/lifecycle" className="mt-3 inline-block text-[13px] font-semibold text-accent-text">
            Read the lifecycle
          </Link>
        </aside>
      </div>
    </div>
  )
}
