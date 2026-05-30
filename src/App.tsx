import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { ChatView } from './components/ChatView'
import { WelcomeView } from './components/WelcomeView'
import type { Mode } from './lib/types'

export default function App() {
  const [mode, setMode] = useState<Mode>('chat')
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  // Bumped to force the sidebar to refetch its chat list after a turn lands.
  const [sidebarRefresh, setSidebarRefresh] = useState(0)

  function handleModeChange(next: Mode) {
    setMode(next)
    if (next !== 'chat') setActiveChatId(null)
  }

  return (
    <div className="flex h-full" style={{ background: 'var(--color-app-bg)' }}>
      <Sidebar
        mode={mode}
        onModeChange={handleModeChange}
        activeChatId={activeChatId}
        onChatSelect={(id) => {
          setActiveChatId(id)
        }}
        refreshKey={sidebarRefresh}
      />
      <main className="flex-1 flex flex-col h-full">
        <Header mode={mode} />
        {mode === 'chat' ? (
          <ChatView
            chatId={activeChatId}
            onChatCreated={(id) => setActiveChatId(id)}
            onChatTouched={() => setSidebarRefresh((k) => k + 1)}
          />
        ) : (
          <WelcomeView mode={mode} />
        )}
      </main>
    </div>
  )
}
