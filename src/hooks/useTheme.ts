import { useEffect, useState } from 'react'

const KEY = 'tadqeeq.theme'
export type Theme = 'dark' | 'light'

function readInitial(): Theme {
  const stored = (typeof localStorage !== 'undefined'
    ? localStorage.getItem(KEY)
    : null) as Theme | null
  return stored === 'light' ? 'light' : 'dark'
}

// Module-level subscriber list. Sidebar and Header both call useTheme, so
// when one toggles we need the other to re-render with the new icon —
// localStorage alone doesn't notify same-window listeners.
const listeners = new Set<(t: Theme) => void>()

export function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setLocal] = useState<Theme>(readInitial)

  useEffect(() => {
    const cb = (t: Theme) => setLocal(t)
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(KEY, theme)
  }, [theme])

  function setTheme(next: Theme) {
    setLocal(next)
    listeners.forEach((fn) => {
      if (fn !== setLocal) fn(next)
    })
  }

  return [theme, setTheme]
}
