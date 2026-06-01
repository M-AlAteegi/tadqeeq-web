import { useCallback, useEffect, useState } from 'react'
import type { ChatSummary, LibraryChatSummary, Mode } from '../lib/types'
import { ModePill } from './ModePill'
import { ChatList } from './ChatList'
import { LibraryChatList } from './LibraryChatList'
import { AnalysisSidebarSettings } from './AnalysisSidebarSettings'
import { ConfirmModal } from './ConfirmModal'
import { useToast } from './Toast'
import { useTheme } from '../hooks/useTheme'
import { api } from '../lib/api'

interface Props {
  mode: Mode
  onModeChange: (m: Mode) => void
  activeChatId: string | null
  onChatSelect: (id: string | null) => void
  onNewChat: () => void
  onSuggestion?: (question: string) => void
  onOpenSettings?: () => void
  refreshKey: number
  collapsed?: boolean
}

export function Sidebar({
  mode,
  onModeChange,
  activeChatId,
  onChatSelect,
  onNewChat,
  onSuggestion,
  onOpenSettings,
  refreshKey,
  collapsed = false,
}: Props) {
  const [theme, setTheme] = useTheme()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [libChats, setLibChats] = useState<LibraryChatSummary[]>([])
  // Delete request from ChatList / LibraryChatList opens a ConfirmModal —
  // native confirm() looks out of place against the v3.2 glass aesthetic.
  const [pendingDelete, setPendingDelete] = useState<{ id: string; preview: string } | null>(null)
  const toast = useToast()

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

  function requestDelete(id: string) {
    const list = mode === 'library' ? libChats : chats
    const found = list.find((c) => c.id === id)
    setPendingDelete({ id, preview: found?.preview ?? 'this chat' })
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const id = pendingDelete.id
    const isLibrary = mode === 'library'
    setPendingDelete(null)
    try {
      if (isLibrary) {
        await api.deleteLibraryChat(id)
      } else {
        await api.deleteChat(id)
      }
      if (activeChatId === id) onChatSelect(null)
      await loadChats()
      toast.show(isLibrary ? 'Clause chat deleted' : 'Chat deleted')
    } catch {
      toast.show('Delete failed', 'info')
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
          {mode === 'analysis' && (
            // Bootstrap upload icon — only analysis mode shows an icon.
            // Chat/Library use text alone (the "+" was reading as cluttered).
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
            </svg>
          )}
          <span className="new-chat-label">
            {mode === 'library' ? 'New Clause' : mode === 'analysis' ? 'Upload file' : 'New Chat'}
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
              onDelete={requestDelete}
            />
          ) : (
            <LibraryChatList
              chats={libChats}
              activeId={activeChatId}
              onSelect={onChatSelect}
              onDelete={requestDelete}
            />
          )}
        </div>
      )}

      {/* Analysis settings sidebar — visible only in analysis mode. */}
      <div
        id="analysisSidebar"
        className={showAnalysisSidebar ? 'visible' : ''}
        aria-label="Analysis settings"
      >
        {showAnalysisSidebar && <AnalysisSidebarSettings />}
      </div>

      {/* "Try These" examples — preserved from v3.2 */}
      {mode === 'chat' && (
        <div className="examples" style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
          <div className="history-title" style={{ padding: '0 0 12px 0' }}>Try These</div>
          <div
            className="history-item ex"
            onClick={() => onSuggestion?.('What are the licensing fees for finance companies?')}
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
            onClick={() => onSuggestion?.('What is a qualified investor?')}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
            <button
              className="theme-toggle-sidebar"
              title="Settings"
              aria-label="Open settings"
              onClick={onOpenSettings}
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
              </svg>
            </button>
          </div>
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
      <ConfirmModal
        open={!!pendingDelete}
        title={mode === 'library' ? 'Delete Clause Chat' : 'Delete Chat'}
        message={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.preview}"? This action is permanent and cannot be undone.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </aside>
  )
}
