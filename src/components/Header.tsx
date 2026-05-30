import type { Mode } from '../lib/types'

interface Props {
  mode: Mode
  onNewChat: () => void
  onToggleSidebar?: () => void
}

const MODE_LABEL: Record<Mode, string> = {
  chat: 'Chat',
  library: 'Library',
  analysis: 'Analysis',
}

export function Header({ mode, onNewChat, onToggleSidebar }: Props) {
  const badgeClass = `header-title-badge mode-${mode}`
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          id="menuBtn"
          className="menu-btn"
          title="Toggle Sidebar"
          aria-label="Toggle sidebar navigation"
          onClick={onToggleSidebar}
          type="button"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
        <span className="header-title" id="headerTitle">
          Saudi Financial Law Assistant
          <span className={badgeClass} id="headerModeBadge">
            {MODE_LABEL[mode]}
          </span>
        </span>
      </div>
      <div className="header-actions">
        <button
          className="header-btn primary"
          id="newChatBtnHeader"
          onClick={onNewChat}
          type="button"
        >
          <svg viewBox="0 0 24 24" strokeWidth={2}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="new-chat-label">
            {mode === 'library' ? 'New Clause' : mode === 'analysis' ? 'New Document' : 'New Chat'}
          </span>
        </button>
      </div>
    </header>
  )
}
