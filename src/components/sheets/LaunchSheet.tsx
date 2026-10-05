import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Coin } from '@/lib/types'
import { cn } from '@/lib/cn'
import { sol } from '@/lib/format'
import { CURVE_TARGET_SOL, SOL_USD } from '@/lib/rules'
import { addCoin, findCoin, showStage, toggleWallet, wallet } from '@/lib/session'
import { useTitle } from '@/lib/useTitle'
import { useNow } from '@/lib/clock'
import { Sheet } from '@/components/shell/Sheet'
import { Button } from '@/components/ui/Button'
import { Area, Field } from '@/components/ui/Field'
import { CoinCard } from '@/components/board/CoinCard'

const hues = [265, 215, 172, 150, 95, 48, 22, 330]
const START_PRICE = 0.000028

/**
 * The launch composer. Its preview is the exact card that will appear on the board; when you
 * launch, the sheet closes and that card lands at the top of the Curve column.
 */
export function LaunchSheet() {
  useTitle('Create a launch')
  const navigate = useNavigate()
  const address = wallet.use()
  const now = useNow()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [touched, setTouched] = useState(false)
  const [blurb, setBlurb] = useState('')
  const [hue, setHue] = useState(hues[0])
  const [buy, setBuy] = useState('')
  const [tried, setTried] = useState(false)
  const [pending, setPending] = useState(false)

  const sym = (touched ? symbol : name.replace(/[^a-z0-9]/gi, '').slice(0, 6)).toUpperCase()
  const raised = Math.min(CURVE_TARGET_SOL * 0.5, Number(buy) || 0)
  const errors = {
    name: name.trim().length < 2 ? 'Give it a name of at least 2 characters.' : null,
    symbol: !/^[A-Z0-9]{2,6}$/.test(sym) ? '2 to 6 letters or numbers.' : findCoin(sym.toLowerCase()) ? 'That ticker is taken.' : null,
    blurb: blurb.trim().length < 10 ? 'A sentence about it, at least 10 characters.' : null,
  }
  const valid = !errors.name && !errors.symbol && !errors.blurb

  const draft: Coin = {
    id: sym.toLowerCase() || 'new',
    symbol: sym || 'TICKER',
    name: name.trim() || 'Your coin',
    hue,
    blurb: blurb.trim(),
    creator: address ?? 'you',
    launchedAt: now,
    mine: true,
    price: START_PRICE * (1 + raised / 20),
    change24h: 0,
    supply: 100_000_000,
    volume24h: raised * SOL_USD,
    holders: raised ? 1 : 0,
    raisedSol: raised,
  }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setTried(true)
    if (!address) return toggleWallet()
    if (!valid) return
    setPending(true)
    window.setTimeout(() => {
      addCoin({ ...draft, launchedAt: Date.now() })
      navigate('/markets')
      showStage('curve')
    }, 900)
  }

  return (
    <Sheet
      label="Create a launch"
      onClose={() => navigate('/markets')}
      head={<h2 className="text-[20px] leading-tight">Create a launch</h2>}
      footer={
        <div className="flex items-center gap-3">
          <Button variant="primary" size="lg" className="flex-1 disabled:opacity-100" disabled={pending} onClick={() => submit()}>
            {!address ? 'Connect wallet to launch' : pending ? 'Confirm in wallet…' : `Launch $${sym || '…'} on its curve`}
          </Button>
        </div>
      }
    >
      <p className="text-[14.5px] leading-relaxed text-ink-2">Every coin starts on a bonding curve. Spot and leverage come later, earned through the same gates as every other coin.</p>

      <div className="mt-6">
        <p className="label">How it lands on the board</p>
        <div className="mt-3 rounded-[18px] bg-bg p-3 ring-1 ring-line ring-inset">
          <p className="mb-2.5 flex items-baseline gap-2 px-0.5">
            <span className="font-mono text-[11px] text-accent-text">01</span>
            <span className="text-[13px] font-semibold">Bonding curve</span>
          </p>
          <CoinCard coin={draft} stage="curve" now={now} preview />
        </div>
      </div>

      <form onSubmit={submit} noValidate className="mt-7 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-[1fr_150px]">
          <Field label="Name" placeholder="Lantern" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} error={tried ? errors.name : null} />
          <Field
            label="Ticker"
            placeholder="LNTRN"
            value={sym}
            onChange={(e) => {
              setTouched(true)
              setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
            }}
            error={tried ? errors.symbol : null}
            className="[&_input]:font-mono"
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
                aria-label={`Colour ${hues.indexOf(h) + 1}`}
                aria-pressed={hue === h}
                onClick={() => setHue(h)}
                className={cn('size-9 rounded-full ring-offset-2 ring-offset-surface transition-shadow', hue === h ? 'ring-2 ring-ink' : 'ring-0')}
                style={{ background: `radial-gradient(circle at 30% 25%, oklch(0.55 0.13 ${h}), oklch(0.36 0.1 ${h}) 70%)` }}
              />
            ))}
          </div>
        </fieldset>
        <Field
          label="First buy (optional)"
          placeholder="0.0"
          inputMode="decimal"
          value={buy}
          onChange={(e) => setBuy(e.target.value.replace(/[^\d.]/g, ''))}
          hint={raised ? `${sol(raised)} of the ${CURVE_TARGET_SOL} SOL curve` : 'Buy in at the very bottom of your own curve.'}
          className="[&_input]:font-mono sm:max-w-[240px]"
        />
        {tried && !valid && address && <p className="text-[13px] text-down">Fix the fields above, then launch.</p>}
        <p className="text-[12px] leading-relaxed text-ink-3">Concept only: launching adds the coin to the board for this visit.</p>
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
