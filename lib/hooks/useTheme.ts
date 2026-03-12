'use client'
// lib/hooks/useTheme.ts — dark/light mode boshqaruvi

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (t: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function useThemeState() {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) ?? 'system'
    setThemeState(saved)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    function apply(t: Theme) {
      const isDark = t === 'dark' || (t === 'system' && mq.matches)
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
      setResolvedTheme(isDark ? 'dark' : 'light')
    }

    apply(theme)

    const handler = () => { if (theme === 'system') apply('system') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('theme', t)
  }

  return { theme, resolvedTheme, setTheme }
}
