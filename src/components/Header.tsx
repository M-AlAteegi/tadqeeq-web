import type { Mode } from '../lib/types'

interface Props {
  mode: Mode
}

const MODE_META: Record<Mode, { label: string; accent: string }> = {
  chat: { label: 'Chat', accent: 'var(--color-accent-chat)' },
  library: { label: 'Library', accent: 'var(--color-accent-library)' },
  analysis: { label: 'Analysis', accent: 'var(--color-accent-analysis)' },
}

export function Header({ mode }: Props) {
  const { label, accent } = MODE_META[mode]
  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{ background: 'var(--color-app-bg)', borderColor: 'var(--color-app-border)' }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--color-app-text)' }}>
          Saudi Financial Law Assistant
        </h1>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: accent, color: '#0a0e14', fontWeight: 600 }}
        >
          {label}
        </span>
      </div>
    </header>
  )
}
