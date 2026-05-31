import type { Mode } from '../lib/types'
import { SaveReportMenu, type ExportFormat } from './SaveReportMenu'
import { useTheme } from '../hooks/useTheme'

export interface AnalysisSaveBundle {
  urls: Record<ExportFormat, string>
  baseName: string
  buttonLabel: string
}

interface Props {
  mode: Mode
  activeChatId: string | null
  onNewChat: () => void
  onToggleSidebar?: () => void
  // True when the sidebar is hidden. v3.2 pattern: the header reveals
  // the secondary chrome (theme toggle, divider, +New Chat button) so the
  // user keeps access to those actions without the sidebar.
  sidebarCollapsed?: boolean
  // Set by AnalysisView when a compliance / brief report has been
  // produced. Null otherwise. Lives at App level so the Header can render
  // the Save button right where v3.2 had it (next to Export), instead of
  // under the card body.
  analysisSave?: AnalysisSaveBundle | null
}

const MODE_LABEL: Record<Mode, string> = {
  chat: 'Chat',
  library: 'Library',
  analysis: 'Analysis',
}

function buildChatUrls(id: string) {
  return {
    pdf: `/api/chats/${id}/export/pdf`,
    docx: `/api/chats/${id}/export/docx`,
    md: `/api/chats/${id}/export/markdown`,
  }
}

function buildLibraryUrls(id: string) {
  return {
    pdf: `/api/library/chats/${id}/export/pdf`,
    docx: `/api/library/chats/${id}/export/docx`,
    md: `/api/library/chats/${id}/export/markdown`,
  }
}

const SUN_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
)

const MOON_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

export function Header({
  mode,
  activeChatId,
  onNewChat,
  onToggleSidebar,
  sidebarCollapsed = false,
  analysisSave = null,
}: Props) {
  const [theme, setTheme] = useTheme()
  const badgeClass = `header-title-badge mode-${mode}`
  const showExport = activeChatId && (mode === 'chat' || mode === 'library')
  const exportUrls = showExport
    ? mode === 'chat'
      ? buildChatUrls(activeChatId)
      : buildLibraryUrls(activeChatId)
    : null
  const exportBaseName = showExport
    ? mode === 'chat'
      ? `tadqeeq-chat-${activeChatId}`
      : `tadqeeq-library-${activeChatId}`
    : ''

  // .visible toggling matches v3.2 updateHeaderState() — the CSS in
  // v3.css keeps these elements at width/opacity 0 until .visible lands.
  const collapseClass = sidebarCollapsed ? 'visible' : ''

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
          id="themeToggleHeader"
          className={collapseClass}
          title="Switch Theme"
          aria-label="Switch colour theme"
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? SUN_ICON : MOON_ICON}
        </button>
        <div id="headerDivider" className={collapseClass}></div>
        {exportUrls && (
          <SaveReportMenu
            urls={exportUrls}
            suggestedBaseName={exportBaseName}
            buttonLabel="Export"
            primary={false}
          />
        )}
        {analysisSave && (
          // Wrapper id mirrors v3.2 so the entry animation in v3.css fires.
          <div id="analysisSaveWrap" style={{ display: 'inline-block' }}>
            <SaveReportMenu
              urls={analysisSave.urls}
              suggestedBaseName={analysisSave.baseName}
              buttonLabel={analysisSave.buttonLabel}
              primary
            />
          </div>
        )}
        <button
          className={`header-btn primary ${collapseClass}`.trim()}
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
