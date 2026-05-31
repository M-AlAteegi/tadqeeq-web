// v3.2-faithful: .doc-controls loaded-state bar with Scan + Brief + Remove.
// Replaces AnalysisEmptyBar once a document has been uploaded.

interface Props {
  filename: string
  onScan: () => void
  onBrief: () => void
  onRemove: () => void
  // Same picker callback the empty bar uses — lets the user swap the
  // current document without having to first hit Remove.
  onUpload?: () => void
  isRunning?: 'compliance' | 'brief' | null
}

const UPLOAD_ICON_SMALL = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
  </svg>
)

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

export function AnalysisDocControls({ filename, onScan, onBrief, onRemove, onUpload, isRunning }: Props) {
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
        {onUpload && (
          // Icon-only secondary action — lets the user swap to a fresh
          // file without going through Remove. Same picker callback the
          // empty bar uses, so dropping a new file feels identical.
          <button
            type="button"
            className="action-btn upload-swap"
            onClick={onUpload}
            disabled={!!isRunning}
            title="Upload file"
            aria-label="Upload a different file"
            style={{ padding: '8px 10px' }}
          >
            {UPLOAD_ICON_SMALL}
          </button>
        )}
        <button type="button" className="action-btn back" onClick={onRemove} disabled={!!isRunning}>
          Remove
        </button>
      </div>
    </div>
  )
}
