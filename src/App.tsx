import { useEffect, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { ChatView } from './components/ChatView'
import { LibraryView } from './components/LibraryView'
import { AnalysisView } from './components/AnalysisView'
import { useToast } from './components/Toast'
import { api } from './lib/api'
import type { CorpusStats, DocumentMetadata, Mode } from './lib/types'
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
  // Doc uploaded via the chat composer's attach button. App owns this
  // upload flow so the mode swap only fires AFTER a successful upload
  // — if the user cancels the picker, nothing changes. AnalysisView
  // consumes the doc on mount and clears the prop via onPreUploadConsumed.
  const [chatAttachedDoc, setChatAttachedDoc] = useState<DocumentMetadata | null>(null)
  const chatAttachInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

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

  async function handleChatAttachFile(file: File) {
    // Upload FIRST, swap mode only on success. If the user cancels the
    // picker no change event fires, so this path doesn't run and chat
    // mode stays put. Failure surfaces as a toast without changing mode
    // — the user can retry without losing their place in chat.
    try {
      const meta = await api.uploadDocument(file)
      setChatAttachedDoc(meta)
      setMode('analysis')
      toast.show(`Uploaded "${meta.filename}"`)
    } catch (e) {
      const raw = String((e as { message?: string })?.message ?? e)
      const msg = raw.replace(/^error:\s*/i, '').trim() || 'Upload failed'
      toast.show(`Upload failed — ${msg}`, 'info')
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
            // Composer attach → trigger our hidden input. Picker opens
            // in chat mode; mode swap only happens after a successful
            // upload (handleChatAttachFile). Cancelling = no-op.
            onAttach={() => chatAttachInputRef.current?.click()}
          />
        )}
        {mode === 'library' && (
          <LibraryView
            chatId={activeLibraryChatId}
            onChatCreated={setActiveLibraryChatId}
            onChatTouched={() => setSidebarRefresh((k) => k + 1)}
          />
        )}
        {mode === 'analysis' && (
          <AnalysisView
            onSaveBundleChange={setAnalysisSave}
            preUploadedDoc={chatAttachedDoc}
            onPreUploadConsumed={() => setChatAttachedDoc(null)}
          />
        )}
      </main>
      {/* Hidden file input owned by App so the chat composer's attach
          button can pop the picker without first switching modes.
          On change we upload via the regular API path; mode swap +
          AnalysisView hand-off happen only on success. */}
      <input
        ref={chatAttachInputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleChatAttachFile(f)
          e.target.value = ''
        }}
      />
    </>
  )
}
