import { useEffect } from 'react'
import { palette } from '@/lib/session'

/** Opens the command bar from anywhere: ⌘K / Ctrl+K, or / when you're not typing. */
export function usePaletteKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = /^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        palette.set(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
