import type { Mode } from '../lib/types'

interface Props {
  mode: Mode
  onChange: (m: Mode) => void
}

const MODES: { id: Mode; label: string; color: string }[] = [
  { id: 'chat', label: 'Chat', color: 'var(--color-accent-chat)' },
  { id: 'library', label: 'Library', color: 'var(--color-accent-library)' },
  { id: 'analysis', label: 'Analysis', color: 'var(--color-accent-analysis)' },
]

export function ModePill({ mode, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Mode selector"
      className="flex items-center gap-1 p-1 rounded-full"
      style={{ background: 'var(--color-app-card)' }}
    >
      {MODES.map((m) => {
        const active = m.id === mode
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.id)}
            className="px-3 py-1.5 text-sm rounded-full transition-colors cursor-pointer"
            style={{
              background: active ? m.color : 'transparent',
              color: active ? '#0a0e14' : 'var(--color-app-text-dim)',
              fontWeight: active ? 600 : 500,
            }}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
