import { useCallback, useEffect, useState } from 'react'
import type { ChatSummary, Mode } from '../lib/types'
import { ModePill } from './ModePill'
import { ChatList } from './ChatList'
import { useTheme } from '../hooks/useTheme'
import { api } from '../lib/api'

interface Props {
  mode: Mode
  onModeChange: (m: Mode) => void
  activeChatId: string | null
  onChatSelect: (id: string | null) => void
  refreshKey: number
}

export function Sidebar({
  mode,
  onModeChange,
  activeChatId,
  onChatSelect,
  refreshKey,
}: Props) {
  const [theme, setTheme] = useTheme()
  const [providerInfo, setProviderInfo] = useState<string>('')
  const [chats, setChats] = useState<ChatSummary[]>([])

  useEffect(() => {
    api
      .health()
      .then((h) => setProviderInfo(`${h.llm_provider} · ${h.llm_model}`))
      .catch(() => setProviderInfo('backend unreachable'))
  }, [])

  // Refetch on mode change AND on parent-triggered refresh (e.g. after a chat
  // turn lands so the new preview + message count show up in the sidebar).
  const loadChats = useCallback(async () => {
    if (mode !== 'chat') return
    try {
      const { chats } = await api.listChats(20)
      setChats(chats)
    } catch {
      setChats([])
    }
  }, [mode])

  useEffect(() => {
    loadChats()
  }, [loadChats, refreshKey])

  async function handleDelete(id: string) {
    try {
      await api.deleteChat(id)
      if (activeChatId === id) onChatSelect(null)
      await loadChats()
    } catch {
      /* silent — sidebar list will look stale until next refresh */
    }
  }

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
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-app-card-hover)', color: 'var(--color-app-text-dim)' }}
          >
            v4.0-dev
          </span>
        </div>
        <ModePill mode={mode} onChange={onModeChange} />
      </div>

      {mode === 'chat' && (
        <button
          onClick={() => onChatSelect(null)}
          className="mx-3 mt-3 px-3 py-2 text-sm rounded-md cursor-pointer flex items-center gap-2"
          style={{
            background: 'var(--color-app-card-hover)',
            color: 'var(--color-app-text)',
          }}
        >
          <span style={{ color: 'var(--color-accent-chat)' }}>+</span>
          <span>New chat</span>
        </button>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        <div
          className="text-xs uppercase tracking-wider mb-2 px-2"
          style={{ color: 'var(--color-app-text-dim)' }}
        >
          Recent
        </div>
        {mode === 'chat' ? (
          <ChatList
            chats={chats}
            activeId={activeChatId}
            onSelect={onChatSelect}
            onDelete={handleDelete}
          />
        ) : (
          <div className="text-sm px-2 py-3" style={{ color: 'var(--color-app-text-dim)' }}>
            (No recent {mode === 'analysis' ? 'documents' : 'discussions'} yet.)
          </div>
        )}
      </div>

      <div
        className="p-3 border-t text-xs"
        style={{ borderColor: 'var(--color-app-border)', color: 'var(--color-app-text-dim)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span title="LLM provider reported by /health">{providerInfo || 'checking…'}</span>
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
