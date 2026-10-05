import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface Base {
  label: string
  hint?: ReactNode
  error?: string | null
  className?: string
}

const box = 'mt-2 block w-full rounded-control bg-raised px-3.5 text-[15px] outline-none ring-1 ring-transparent transition-shadow focus:ring-accent'

export function Field({ label, hint, error, className, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      <input {...rest} aria-invalid={Boolean(error)} className={cn(box, 'h-12', error && 'ring-down')} />
      {(error || hint) && <span className={cn('mt-1.5 block text-[12px]', error ? 'text-down' : 'text-ink-3')}>{error || hint}</span>}
    </label>
  )
}

export function Area({ label, hint, error, className, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      <textarea {...rest} aria-invalid={Boolean(error)} className={cn(box, 'resize-none py-3 leading-relaxed', error && 'ring-down')} />
      {(error || hint) && <span className={cn('mt-1.5 block text-[12px]', error ? 'text-down' : 'text-ink-3')}>{error || hint}</span>}
    </label>
  )
}
