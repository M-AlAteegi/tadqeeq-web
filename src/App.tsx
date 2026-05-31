import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { ChatView } from './components/ChatView'
import { LibraryView } from './components/LibraryView'
import { AnalysisView } from './components/AnalysisView'
import { api } from './lib/api'
import type { CorpusStats, Mode } from './lib/types'
import type { AnalysisSaveBundle } from './components/Header'

export default function App() {
  const [mode, setMode] = useState<Mode>('chat')
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeLibraryChatId, setActiveLibraryChatId] = useState<string | null>(null)
  const [sidebarRefresh, setSidebarRefresh] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [stats, setStats] = useState<CorpusStats | undefined>(undefined)
  // "Try These" sidebar items set this; ChatView consumes it once on
  // change and immediately sends as a chat question.
  const [pendingChatPrompt, setPendingChatPrompt] = useState<string | null>(null)
  // AnalysisView reports up the current report's export bundle so the
  // Header can render Save Report in the same row as Export (v3.2 layout).
  // Null when no report is showing or analysis isn't the active mode.
  const [analysisSave, setAnalysisSave] = useState<AnalysisSaveBundle | null>(null)

  // One-shot corpus stats fetch (powered by /health). The backend's RAG
  // init takes ~20s so the first call may return zeros; we don't poll
  // because once it's ready the numbers don't change for this session.
  useEffect(() => {
    let cancelled = false
    let attempts = 0
    function tick() {
      if (cancelled) return
      attempts += 1
      api
        .health()
        .then((h) => {
          if (cancelled) return
          if (h.stats && h.stats.total > 0) {
            setStats(h.stats)
          } else if (attempts < 12) {
            setTimeout(tick, 2500)
          }
        })
        .catch(() => {
          if (!cancelled && attempts < 12) setTimeout(tick, 2500)
        })
    }
    tick()
    return () => {
      cancelled = true
    }
  }, [])

  function handleModeChange(next: Mode) {
    setMode(next)
    if (next === 'analysis') {
      setActiveChatId(null)
      setActiveLibraryChatId(null)
    }
  }

  function handleNewChat() {
    if (mode === 'library') setActiveLibraryChatId(null)
    else setActiveChatId(null)
  }

  function handleChatSelect(id: string | null) {
    if (mode === 'library') setActiveLibraryChatId(id)
    else setActiveChatId(id)
  }

  const activeIdForMode = mode === 'library' ? activeLibraryChatId : activeChatId

  return (
    <>
      <Sidebar
        mode={mode}
        onModeChange={handleModeChange}
        activeChatId={activeIdForMode}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onSuggestion={(q) => {
          // Switch to chat + fresh chat + queue the prompt; ChatView
          // picks it up via its pendingPrompt prop.
          setMode('chat')
          setActiveChatId(null)
          setPendingChatPrompt(q)
        }}
        refreshKey={sidebarRefresh}
        collapsed={sidebarCollapsed}
      />
      <main className="main" style={{ position: 'relative' }}>
        <Header
          mode={mode}
          activeChatId={activeIdForMode}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          sidebarCollapsed={sidebarCollapsed}
          analysisSave={mode === 'analysis' ? analysisSave : null}
        />
        {mode === 'chat' && (
          <ChatView
            chatId={activeChatId}
            onChatCreated={setActiveChatId}
            onChatTouched={() => setSidebarRefresh((k) => k + 1)}
            stats={stats}
            pendingPrompt={pendingChatPrompt}
            onPromptConsumed={() => setPendingChatPrompt(null)}
          />
        )}
        {mode === 'library' && (
          <LibraryView
            chatId={activeLibraryChatId}
            onChatCreated={setActiveLibraryChatId}
            onChatTouched={() => setSidebarRefresh((k) => k + 1)}
          />
        )}
        {mode === 'analysis' && <AnalysisView onSaveBundleChange={setAnalysisSave} />}
      </main>
    </>
  )
}
