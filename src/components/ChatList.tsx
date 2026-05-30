import type { ChatSummary } from '../lib/types'

interface Props {
  chats: ChatSummary[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

const REG_COLOR: Record<string, string> = {
  SAMA: 'var(--color-accent-library)',  // blue
  CMA: 'var(--color-accent-chat)',      // teal
}

export function ChatList({ chats, activeId, onSelect, onDelete }: Props) {
  if (chats.length === 0) {
    return (
      <div
        className="text-sm px-2 py-3"
        style={{ color: 'var(--color-app-text-dim)' }}
      >
        (No recent chats yet.)
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {chats.map((c) => {
        const active = c.id === activeId
        const regColor = c.regulator ? REG_COLOR[c.regulator] : null
        return (
          <li key={c.id}>
            <div
              className="group flex items-center gap-2 px-2 py-2 rounded cursor-pointer text-sm"
              style={{
                background: active ? 'var(--color-app-card-hover)' : 'transparent',
              }}
              onClick={() => onSelect(c.id)}
            >
              {regColor ? (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: regColor }}
                  title={c.regulator ?? undefined}
                />
              ) : (
                <span className="w-1.5 h-1.5 flex-shrink-0" />
              )}
              <span
                className="flex-1 truncate"
                style={{ color: active ? 'var(--color-app-text)' : 'var(--color-app-text-dim)' }}
                title={c.preview}
              >
                {c.preview}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(c.id)
                }}
                aria-label={`Delete chat ${c.preview}`}
                title="Delete chat"
                className="opacity-0 group-hover:opacity-100 text-xs px-1.5 py-0.5 rounded transition-opacity cursor-pointer"
                style={{
                  color: 'var(--color-app-text-dim)',
                }}
              >
                ✕
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
