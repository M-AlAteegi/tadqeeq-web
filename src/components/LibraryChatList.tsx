import type { LibraryChatSummary } from '../lib/types'
import { visualFor } from '../lib/libCategoryVisuals'

interface Props {
  chats: LibraryChatSummary[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

const ICON_MENU = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="6" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="18" r="2" />
  </svg>
)

export function LibraryChatList({ chats, activeId, onSelect, onDelete }: Props) {
  if (chats.length === 0) {
    return (
      <div style={{ padding: '12px', color: 'var(--text3)', fontSize: '12px' }}>
        No recent clause chats yet.
      </div>
    )
  }
  return (
    <>
      {chats.map((c) => {
        const active = c.id === activeId
        const vis = visualFor(c.category_id)
        return (
          <div
            key={c.id}
            className={active ? 'history-item active' : 'history-item'}
            data-id={c.id}
            onClick={() => onSelect(c.id)}
          >
            <span className="history-item-text">{c.preview}</span>
            <div className="history-item-slot">
              <div
                className="history-item-badge"
                style={{ ['--badge-color' as string]: vis.color } as React.CSSProperties}
                title={c.category_id ?? 'Library'}
              >
                <span className="badge-dot" />
              </div>
              <div
                className="history-item-menu"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Delete clause chat "${c.preview}"?`)) onDelete(c.id)
                }}
                role="button"
                aria-label="Delete library chat"
                title="Delete library chat"
              >
                {ICON_MENU}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
