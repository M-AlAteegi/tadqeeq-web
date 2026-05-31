// Blocking modal shown while a compliance scan or brief generation is
// in flight. v3.css doesn't have a progress card — only modal-overlay
// chrome — so the inner card is styled inline. Renders through a
// portal to document.body so the .main panel's transform doesn't
// capture the fixed-position overlay (same pattern the delete modal
// uses).

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  kind: 'compliance' | 'brief'
  onCancel: () => void
}

const COPY: Record<Props['kind'], { title: string; subtitle: string; cancel: string }> = {
  compliance: {
    title: 'Running compliance scan…',
    subtitle: 'Auditing the document against SAMA / CMA disclosure rules.',
    cancel: 'Cancel scan',
  },
  brief: {
    title: 'Generating executive brief…',
    subtitle: 'Extracting risks, obligations, and deadlines from the document.',
    cancel: 'Cancel brief',
  },
}

export function AnalysisProgressModal({ kind, onCancel }: Props) {
  // Lock body scroll while the modal is open. Restore on unmount even
  // if the user navigates away mid-run.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const copy = COPY[kind]

  return createPortal(
    <div className="modal-overlay show" aria-modal="true" role="dialog" aria-live="polite">
      <div
        style={{
          width: 420,
          maxWidth: 'calc(100vw - 48px)',
          padding: 28,
          borderRadius: 24,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div className="modal-title" style={{ marginBottom: 0 }}>{copy.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{copy.subtitle}</div>
        <div className="progress-indeterminate" role="progressbar" aria-label={copy.title}>
          <div className="progress-bar" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            type="button"
            className="header-btn"
            onClick={onCancel}
            style={{ fontWeight: 600 }}
          >
            {copy.cancel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
