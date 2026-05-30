import { useEffect, useState } from 'react'
import type { ClauseDetail } from '../lib/types'

interface Props {
  clause: ClauseDetail | null
  open: boolean
  onClose: () => void
  onInsert: (clause: ClauseDetail) => void
}

type Lang = 'en' | 'ar'

export function ClausePreviewModal({ clause, open, onClose, onInsert }: Props) {
  const [lang, setLang] = useState<Lang>('en')

  // Reset to EN when a different clause opens.
  useEffect(() => {
    if (clause) setLang(clause.body_en ? 'en' : 'ar')
  }, [clause])

  // ESC to close.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!clause) return null

  const body = lang === 'ar' ? clause.body_ar || '' : clause.body_en || ''
  const title = lang === 'ar' && clause.title_ar ? clause.title_ar : clause.title_en
  const isArabic = lang === 'ar'

  return (
    <div
      className={open ? 'clause-overlay show' : 'clause-overlay'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="clauseModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="clause-panel">
        <div className="clause-panel-head">
          <div className="clause-panel-meta">
            <div className="clause-panel-type">{clause.type ?? 'clause'}</div>
            <div
              className="clause-panel-title"
              id="clauseModalTitle"
              dir={isArabic ? 'rtl' : 'auto'}
            >
              {title}
            </div>
            {clause.source_note && (
              <div className="clause-panel-source">{clause.source_note}</div>
            )}
          </div>
          <div className="clause-panel-lang-toggle" role="radiogroup" aria-label="Language">
            <button
              type="button"
              className={`dfmt-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              disabled={!clause.body_en}
            >
              EN
            </button>
            <button
              type="button"
              className={`dfmt-btn ${lang === 'ar' ? 'active' : ''}`}
              onClick={() => setLang('ar')}
              disabled={!clause.body_ar}
            >
              AR
            </button>
          </div>
        </div>
        <div className={isArabic ? 'clause-panel-body rtl' : 'clause-panel-body'}>{body}</div>
        <div className="clause-panel-actions">
          <button
            type="button"
            className="modal-btn cancel"
            style={{ color: 'var(--text2)' }}
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="modal-btn"
            style={{
              background: 'var(--accent)',
              color: 'white',
              borderColor: 'var(--accent)',
            }}
            onClick={() => {
              onInsert(clause)
              onClose()
            }}
          >
            Insert to Chat
          </button>
        </div>
      </div>
    </div>
  )
}
