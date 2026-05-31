// v3.2-faithful: .toast-notification pill at the top of the screen.
// Provides a global `toast()` helper via context — components fire it
// (success / info) and the provider manages the timed slide-in/out.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type Variant = 'success' | 'info'

interface ToastState {
  id: number
  text: string
  variant: Variant
}

interface ToastApi {
  show: (text: string, variant?: Variant) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const ICON_CHECK = (
  <svg viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const ICON_INFO = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="8" />
  </svg>
)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timerRef = useRef<number | null>(null)
  const nextIdRef = useRef(0)

  const show = useCallback((text: string, variant: Variant = 'success') => {
    nextIdRef.current += 1
    setToast({ id: nextIdRef.current, text, variant })
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className={toast ? 'toast-notification show' : 'toast-notification'}
        role="status"
        aria-live="polite"
      >
        <div
          className="toast-icon"
          style={toast?.variant === 'info' ? { background: '#3b82f6' } : undefined}
        >
          {toast?.variant === 'info' ? ICON_INFO : ICON_CHECK}
        </div>
        <span className="toast-text">{toast?.text ?? ''}</span>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // No provider mounted — return a no-op so components don't crash.
    return { show: () => {} }
  }
  return ctx
}
