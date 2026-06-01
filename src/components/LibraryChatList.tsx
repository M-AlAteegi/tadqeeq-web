import type { LibraryChatSummary } from '../lib/types'
import { visualFor } from '../lib/libCategoryVisuals'
import { Skeleton } from './Skeleton'

interface Props {
  chats: LibraryChatSummary[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  loading?: boolean
}

const ICON_MENU = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="6" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="18" r="2" />
  </svg>
)

export function LibraryChatList({ chats, activeId, onSelect, onDelete, loading }: Props) {
  if (chats.length === 0) {
    if (loading) {
      return (
        <div style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={32} radius={8} />
          ))}
        </div>
      )
    }
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
                  onDelete(c.id)
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
