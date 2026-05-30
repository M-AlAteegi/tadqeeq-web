// v3.2-faithful: .brief-wrapper > .brief-card with purple-gradient .brief-header
// + .brief-content markdown body. AI GENERATED pill in the top-right.
//
// Language selection: caller's reportLanguage wins when 'en' or 'ar'. 'auto'
// shows the primary (the language the backend actually synthesised in).
// 'bilingual' shows EN above, separator, AR below — both come from the
// localized cache the backend returned.

import { Markdown } from '../lib/markdown'
import type { BriefResult, ReportLanguage } from '../lib/types'

interface Props {
  result: BriefResult
  filename: string
  reportLanguage?: ReportLanguage
}

const BRIEF_ICON_LARGE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

function pickReport(result: BriefResult, pref: ReportLanguage): string {
  if (pref === 'bilingual') {
    const en = result.localized?.en ?? ''
    const ar = result.localized?.ar ?? ''
    if (en && ar) return `${en}\n\n---\n\n${ar}`
    return en || ar || result.report
  }
  if (pref === 'en' || pref === 'ar') {
    return result.localized?.[pref] || result.report
  }
  return result.report
}

export function AnalysisBriefCard({ result, filename, reportLanguage = 'auto' }: Props) {
  const content = pickReport(result, reportLanguage)
  return (
    <div className="brief-wrapper" style={{ marginTop: 40 }}>
      <div className="brief-card">
        <div className="brief-header">
          <div className="brief-title-group">
            <div className="brief-icon-large">{BRIEF_ICON_LARGE}</div>
            <div className="brief-heading">
              <h2>Executive Strategic Brief</h2>
              <p>{filename}</p>
            </div>
          </div>
          <div
            className="ai-label"
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#a78bfa',
              background: 'rgba(139,92,246,0.15)',
              padding: '6px 14px',
              borderRadius: 100,
              border: '1px solid rgba(139,92,246,0.2)',
              letterSpacing: '0.05em',
            }}
          >
            AI GENERATED
          </div>
        </div>
        <div className="brief-content markdown-body" dir="auto">
          <Markdown content={content} />
        </div>
      </div>
    </div>
  )
}
