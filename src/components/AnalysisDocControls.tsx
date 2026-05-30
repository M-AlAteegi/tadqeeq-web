// v3.2-faithful: .doc-controls loaded-state bar with Scan + Brief + Remove.
// Replaces AnalysisEmptyBar once a document has been uploaded.

interface Props {
  filename: string
  onScan: () => void
  onBrief: () => void
  onRemove: () => void
  isRunning?: 'compliance' | 'brief' | null
}

const FILE_ICON = (
  <svg viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

const SCAN_ICON = (
  <svg viewBox="0 0 24 24">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const BRIEF_ICON = (
  <svg viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

export function AnalysisDocControls({ filename, onScan, onBrief, onRemove, isRunning }: Props) {
  return (
    <div id="docControls" className="doc-controls">
      <div className="doc-info">
        <div className="doc-icon">{FILE_ICON}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 10,
              color: 'var(--text3)',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Analysis Mode
          </span>
          <span
            id="docNameDisplay"
            style={{
              fontWeight: 700,
              color: 'var(--text)',
              maxWidth: 240,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={filename}
          >
            {filename}
          </span>
        </div>
      </div>
      <div className="doc-actions">
        <button
          type="button"
          className="action-btn check"
          onClick={onScan}
          disabled={!!isRunning}
        >
          {SCAN_ICON}
          {isRunning === 'compliance' ? 'Scanning…' : 'Scan Compliance'}
        </button>
        <button
          type="button"
          className="action-btn brief"
          onClick={onBrief}
          disabled={!!isRunning}
        >
          {BRIEF_ICON}
          {isRunning === 'brief' ? 'Generating…' : 'Executive Brief'}
        </button>
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
        <button type="button" className="action-btn back" onClick={onRemove} disabled={!!isRunning}>
          Remove
        </button>
      </div>
    </div>
  )
}
