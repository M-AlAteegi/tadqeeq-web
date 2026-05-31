// v3.2-faithful: .modal-overlay + .modal with title + text + Cancel/Confirm.
// Replaces native confirm() everywhere a destructive action needs a real
// dialog (delete chat, delete library chat, eventually delete document).

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: Props) {
  // ESC closes (mirrors v3 deleteModal backdrop-click + cancel behavior).
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  // Portal to <body> so we escape the sidebar's transform: translateZ(0)
  // — that GPU optimisation creates a new containing block for any
  // position: fixed descendant, which is why the modal was rendering
  // inside the sidebar instead of centered with backdrop blur.
  return createPortal(
    <div
      className="modal-overlay show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="modal">
        <div className="modal-title" id="confirmModalTitle">
          {title}
        </div>
        <div className="modal-text">{message}</div>
        <div className="modal-buttons">
          <button
            type="button"
            className="modal-btn cancel"
            style={{ color: 'var(--text2)' }}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? 'modal-btn delete' : 'modal-btn'}
            style={
              destructive
                ? undefined
                : {
                    background: 'var(--accent)',
                    color: 'white',
                    borderColor: 'var(--accent)',
                  }
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
