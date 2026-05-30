import { useEffect, useState } from 'react'

const KEY = 'tadqeeq.theme'
export type Theme = 'dark' | 'light'

function readInitial(): Theme {
  const stored = (typeof localStorage !== 'undefined'
    ? localStorage.getItem(KEY)
    : null) as Theme | null
  return stored === 'light' ? 'light' : 'dark'
}

export function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(readInitial)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(KEY, theme)
  }, [theme])

  return [theme, setTheme]
}
