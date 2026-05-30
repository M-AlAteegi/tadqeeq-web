// Mirror of v3's LIB_CAT_VISUALS — per-category color + icon. Colors are
// the v3 hex values exactly (verified against ui.py line 3497).

import type { ReactNode } from 'react'

export interface LibCategoryVisual {
  color: string
  icon: ReactNode
}

export const LIB_CAT_VISUALS: Record<string, LibCategoryVisual> = {
  murabaha: {
    color: '#3b82f6',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 7h18M3 12h18M3 17h12" />
        <path d="M16 17l2 2 4-4" />
      </svg>
    ),
  },
  ijara: {
    color: '#10b981',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 21V8l9-6 9 6v13" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  wakala: {
    color: '#8b5cf6',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="4" />
        <path d="M5 21v-2a7 7 0 0114 0v2" />
      </svg>
    ),
  },
  mudaraba: {
    color: '#f59e0b',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="8" cy="8" r="4" />
        <circle cx="16" cy="8" r="4" />
        <path d="M2 21v-2a6 6 0 016-6h0M22 21v-2a6 6 0 00-6-6h0" />
      </svg>
    ),
  },
  sukuk: {
    color: '#06b6d4',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M7 9v6M17 9v6" />
      </svg>
    ),
  },
  common: {
    color: '#64748b',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 4h12a4 4 0 014 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
}

export function visualFor(catId: string | null | undefined): LibCategoryVisual {
  return (catId && LIB_CAT_VISUALS[catId]) || {
    color: 'var(--accent)',
    icon: null,
  }
}
