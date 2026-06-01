import type { ChatSummary } from '../lib/types'
import { Skeleton } from './Skeleton'

interface Props {
  chats: ChatSummary[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  // True during the initial / refresh fetch so we can distinguish
  // "we haven't asked yet" (show skeleton rows) from "we asked and
  // there really aren't any chats" (show the empty-state copy).
  loading?: boolean
}

const REG_VAR: Record<string, string> = {
  SAMA: 'var(--sama)',
  CMA: 'var(--cma)',
}

const ICON_MENU = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="6" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="18" r="2" />
  </svg>
)

export function ChatList({ chats, activeId, onSelect, onDelete, loading }: Props) {
  if (chats.length === 0) {
    if (loading) {
      // Four shimmer rows — roughly matches the .history-item visual
      // footprint so the list doesn't reflow when real data lands.
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
        No recent chats yet.
      </div>
    )
  }
  return (
    <>
      {chats.map((c) => {
        const active = c.id === activeId
        const badgeColor = c.regulator ? REG_VAR[c.regulator] : 'var(--accent)'
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
                style={{ ['--badge-color' as string]: badgeColor } as React.CSSProperties}
                title={c.regulator || 'General'}
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
                aria-label="Delete chat"
                title="Delete chat"
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
