import { useEffect } from 'react'

/** Sets the browser tab title for a page: "TIDE · SOV markets". */
export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · SOV markets` : 'SOV markets · Spot earns leverage'
  }, [title])
}
