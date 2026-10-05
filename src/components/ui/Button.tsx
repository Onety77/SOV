import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { buttonClass, type Size, type Variant } from '@/lib/button'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  to?: string
  arrow?: boolean
  children: ReactNode
}

/** A button, or a link that looks like one when `to` is set. */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', to, arrow, className, children, type = 'button', ...rest },
  ref,
) {
  const body = (
    <>
      {children}
      {arrow && <ArrowRight className="size-4" />}
    </>
  )
  // in-page anchors scroll natively; routes go through the router
  if (to?.startsWith('#')) {
    return (
      <a href={to} className={buttonClass(variant, size, className)}>
        {body}
      </a>
    )
  }
  if (to) {
    return (
      <Link to={to} className={buttonClass(variant, size, className)}>
        {body}
      </Link>
    )
  }
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest}>
      {body}
    </button>
  )
})
