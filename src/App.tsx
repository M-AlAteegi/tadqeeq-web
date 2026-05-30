import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { WelcomeView } from './components/WelcomeView'
import type { Mode } from './lib/types'

export default function App() {
  const [mode, setMode] = useState<Mode>('chat')

  return (
    <div className="flex h-full" style={{ background: 'var(--color-app-bg)' }}>
      <Sidebar mode={mode} onModeChange={setMode} />
      <main className="flex-1 flex flex-col h-full">
        <Header mode={mode} />
        <WelcomeView mode={mode} />
      </main>
    </div>
  )
}
