import type { Mode } from '../lib/types'

interface Props {
  mode: Mode
  stats?: { sama: number | string; cma: number | string; total: number | string }
  // Backend is still booting — show an init line under stats so the
  // user knows the placeholders aren't a broken backend.
  isInitializing?: boolean
}

export function WelcomeView({ mode, stats, isInitializing }: Props) {
  if (mode === 'chat') {
    return (
      <div className="welcome" id="welcome">
        <div className="welcome-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="welcome-title">TadqeeqAI</div>
        <div className="welcome-subtitle">
          Your AI-powered regulatory assistant for SAMA and{' '}
          <span style={{ whiteSpace: 'nowrap' }}>CMA compliance.</span>
        </div>
        <div className="welcome-subtitle" style={{ marginTop: 6 }}>
          Ask questions in English or Arabic to explore financial regulations.
        </div>
        <div className="welcome-stats">
          <div className="stat">
            <div className="stat-val">{stats?.sama ?? '-'}</div>
            <div className="stat-lbl">SAMA Articles</div>
          </div>
          <div className="stat">
            <div className="stat-val">{stats?.cma ?? '-'}</div>
            <div className="stat-lbl">CMA Articles</div>
          </div>
          <div className="stat">
            <div className="stat-val">{stats?.total ?? '-'}</div>
            <div className="stat-lbl">Total Indexed</div>
          </div>
        </div>
        {isInitializing && (
          <div className="welcome-initializing" role="status" aria-live="polite">
            <span className="welcome-init-dot" />
            Loading the corpus and embeddings… this takes about 15s on a cold backend.
          </div>
        )}
      </div>
    )
  }

  if (mode === 'library') {
    return (
      <div className="library-welcome">
        <div className="lib-header">
          <h1>Clause Library</h1>
          <p>
            Curated Shariah-compliant contract templates and standalone clauses for Saudi Islamic
            finance work. Browse by instrument category, preview the full text bilingually, and drop
            a clause into the chat below to ask TadqeeqAI for analysis, adaptation, or comparison
            against your own drafts.
          </p>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)' }}>
          (Category grid wires up in the next commit.)
        </div>
      </div>
    )
  }

  // analysis mode welcome
  return (
    <div className="analysis-welcome">
      <div className="analysis-icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
      <div className="analysis-title">Document Analysis</div>
      <div className="analysis-subtitle">
        Upload a PDF or DOCX to run a 6-point compliance audit and generate an executive brief
        grounded in the document.
      </div>
      <div className="analysis-features">
        <div className="analysis-feature">
          <div className="analysis-feature-icon scan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="analysis-feature-title">Compliance Scan</div>
          <div className="analysis-feature-desc">
            6-point keyword audit against SAMA & CMA disclosure rules.
          </div>
        </div>
        <div className="analysis-feature">
          <div className="analysis-feature-icon brief">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="analysis-feature-title">Executive Brief</div>
          <div className="analysis-feature-desc">
            Risks, financial obligations, and deadlines extracted from your document.
          </div>
        </div>
      </div>
      <div className="analysis-tag">Secure Local Environment</div>
    </div>
  )
}
