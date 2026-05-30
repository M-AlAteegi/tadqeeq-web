import type { Mode } from '../lib/types'

interface Props {
  mode: Mode
  onChange: (m: Mode) => void
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'library', label: 'Library' },
  { id: 'analysis', label: 'Analysis' },
]

export function ModePill({ mode, onChange }: Props) {
  return (
    <div className="mode-switcher" id="modeSwitcher" role="tablist" aria-label="App mode">
      {MODES.map((m) => {
        const active = m.id === mode
        return (
          <button
            key={m.id}
            type="button"
            className={active ? 'mode-pill active' : 'mode-pill'}
            data-mode={m.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.id)}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
