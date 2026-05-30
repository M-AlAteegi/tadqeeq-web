import { useEffect, useState } from 'react'
import type { Mode } from '../lib/types'
import { ModePill } from './ModePill'
import { useTheme } from '../hooks/useTheme'
import { api } from '../lib/api'

interface Props {
  mode: Mode
  onModeChange: (m: Mode) => void
}

export function Sidebar({ mode, onModeChange }: Props) {
  const [theme, setTheme] = useTheme()
  const [providerInfo, setProviderInfo] = useState<string>('')

  useEffect(() => {
    api.health()
      .then((h) => setProviderInfo(`${h.llm_provider} · ${h.llm_model}`))
      .catch(() => setProviderInfo('backend unreachable'))
  }, [])

  return (
    <aside
      className="flex flex-col w-72 h-full border-r"
      style={{ background: 'var(--color-app-card)', borderColor: 'var(--color-app-border)' }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-app-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--color-app-text)' }}>
            TadqeeqAI
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-app-card-hover)', color: 'var(--color-app-text-dim)' }}>
            v4.0-dev
          </span>
        </div>
        <ModePill mode={mode} onChange={onModeChange} />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs uppercase tracking-wider mb-2 px-2"
             style={{ color: 'var(--color-app-text-dim)' }}>
          Recent
        </div>
        <div className="text-sm px-2 py-3" style={{ color: 'var(--color-app-text-dim)' }}>
          (No recent {mode === 'analysis' ? 'documents' : 'chats'} yet.)
        </div>
      </div>

      <div className="p-3 border-t text-xs"
           style={{ borderColor: 'var(--color-app-border)', color: 'var(--color-app-text-dim)' }}>
        <div className="flex items-center justify-between mb-2">
          <span title="LLM provider reported by /health">
            {providerInfo || 'checking…'}
          </span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-2 py-1 rounded cursor-pointer"
            style={{ background: 'var(--color-app-card-hover)' }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </aside>
  )
}
