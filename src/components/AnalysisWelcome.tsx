// v3.2-faithful: .analysis-welcome with icon-box + features grid + secure-env tag.
// Empty state shown before any document is uploaded.

export function AnalysisWelcome() {
  return (
    <div className="analysis-welcome">
      <div className="analysis-icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 12h6M9 16h6M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <div className="analysis-title">Document Analysis</div>
      <div className="analysis-subtitle">
        Upload a PDF or DOCX to run compliance scans and generate executive briefs against
        SAMA &amp; CMA regulations.
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
            Audit against SAMA &amp; CMA regulations with pass/fail scoring
          </div>
        </div>
        <div className="analysis-feature">
          <div className="analysis-feature-icon brief">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="analysis-feature-title">Executive Brief</div>
          <div className="analysis-feature-desc">
            AI-generated summary of risks, financials &amp; deadlines
          </div>
        </div>
      </div>
      <div className="analysis-tag">🔒 Secure Environment Active</div>
    </div>
  )
}
