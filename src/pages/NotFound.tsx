import { useTitle } from '@/lib/useTitle'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  useTitle('Not found')
  return (
    <div className="wrap py-20 sm:py-28">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-h1">This page didn’t graduate.</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">There’s nothing at this address. The markets are a click away.</p>
      <Button variant="primary" size="lg" to="/markets" className="mt-8">
        Back to markets
      </Button>
    </div>
  )
}
