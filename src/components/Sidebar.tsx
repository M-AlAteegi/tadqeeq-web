import { useCallback, useEffect, useState } from 'react'
import type { ChatSummary, LibraryChatSummary, Mode } from '../lib/types'
import { ModePill } from './ModePill'
import { ChatList } from './ChatList'
import { LibraryChatList } from './LibraryChatList'
import { useTheme } from '../hooks/useTheme'
import { api } from '../lib/api'

interface Props {
  mode: Mode
  onModeChange: (m: Mode) => void
  activeChatId: string | null
  onChatSelect: (id: string | null) => void
  onNewChat: () => void
  refreshKey: number
  collapsed?: boolean
}

export function Sidebar({
  mode,
  onModeChange,
  activeChatId,
  onChatSelect,
  onNewChat,
  refreshKey,
  collapsed = false,
}: Props) {
  const [theme, setTheme] = useTheme()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [libChats, setLibChats] = useState<LibraryChatSummary[]>([])

  const loadChats = useCallback(async () => {
    if (mode === 'chat') {
      try {
        const { chats } = await api.listChats(20)
        setChats(chats)
      } catch {
        setChats([])
      }
    } else if (mode === 'library') {
      try {
        const { chats } = await api.listLibraryChats(20)
        setLibChats(chats)
      } catch {
        setLibChats([])
      }
    }
  }, [mode])

  useEffect(() => {
    loadChats()
  }, [loadChats, refreshKey])

  async function handleDelete(id: string) {
    try {
      if (mode === 'library') {
        await api.deleteLibraryChat(id)
      } else {
        await api.deleteChat(id)
      }
      if (activeChatId === id) onChatSelect(null)
      await loadChats()
    } catch {
      /* sidebar will look stale until next refresh */
    }
  }

  const showAnalysisSidebar = mode === 'analysis'

  return (
    <aside
      className={collapsed ? 'sidebar collapsed' : 'sidebar'}
      id="sidebar"
      role="navigation"
      aria-label="App navigation"
    >
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon-sidebar">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="logo-text-group">
            <div className="logo-text">TadqeeqAI</div>
            <ModePill mode={mode} onChange={onModeChange} />
          </div>
        </div>
        <button
          className="new-chat-btn"
          id="newChatBtn"
          onClick={onNewChat}
          type="button"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth={2.5} fill="none">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="new-chat-label">
            {mode === 'library' ? 'New Clause' : mode === 'analysis' ? 'New Document' : 'New Chat'}
          </span>
        </button>
      </div>

      {/* Chat history — visible in chat mode, replaced by analysisSidebar
          when in analysis mode (matches v3.2 wiring). */}
      {!showAnalysisSidebar && (
        <div className="chat-history" id="chatHistory">
          <div className="history-title">
            {mode === 'library' ? 'Recent Clauses' : 'Recent Chats'}
          </div>
          {mode === 'chat' ? (
            <ChatList
              chats={chats}
              activeId={activeChatId}
              onSelect={onChatSelect}
              onDelete={handleDelete}
            />
          ) : (
            <LibraryChatList
              chats={libChats}
              activeId={activeChatId}
              onSelect={onChatSelect}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      {/* Analysis settings sidebar — empty placeholder for now; cards
          land when #99 ports analysis mode. */}
      <div
        id="analysisSidebar"
        className={showAnalysisSidebar ? 'visible' : ''}
        aria-label="Analysis settings"
      >
        <div className="ana-section-title">Analysis Settings</div>
        <div className="ana-card" style={{ ['--card-accent' as string]: 'var(--text3)' } as React.CSSProperties}>
          <div className="ana-card-head">
            <span>Coming soon — analysis mode lands in the next commit.</span>
          </div>
        </div>
      </div>

      {/* "Try These" examples — preserved from v3.2 */}
      {mode === 'chat' && (
        <div className="examples" style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
          <div className="history-title" style={{ padding: '0 0 12px 0' }}>Try These</div>
          <div
            className="history-item ex"
            onClick={() => onNewChat()}
            style={{ cursor: 'pointer' }}
          >
            <span>Licensing fees</span>
            <span style={{
              padding: '3px 8px',
              background: 'var(--sama)',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '9px',
            }}>SAMA</span>
          </div>
          <div
            className="history-item ex"
            onClick={() => onNewChat()}
            style={{ cursor: 'pointer' }}
          >
            <span>Qualified investor</span>
            <span style={{
              padding: '3px 8px',
              background: 'var(--cma)',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '9px',
            }}>CMA</span>
          </div>
        </div>
      )}

      <div
        className="sidebar-footer"
        style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            className="theme-toggle-sidebar"
            id="themeToggle"
            title="Toggle Theme"
            aria-label="Toggle colour theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" className="icon-sun">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="icon-moon">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10px',
            color: 'var(--text3)',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}>
            <span className="status-dot"></span>
            TadqeeqAI · v4.0
          </div>
        </div>
      </div>
    </aside>
  )
}
