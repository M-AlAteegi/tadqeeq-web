// v3.2-faithful: .doc-controls shell with a single "Upload File" action.
// Sits in .input-area below the welcome view while no document is loaded.

interface Props {
  onUpload: () => void
}

export function AnalysisEmptyBar({ onUpload }: Props) {
  return (
    <div
      id="analysisEmptyBar"
      className="doc-controls"
      style={{ justifyContent: 'center' }}
    >
      <div className="doc-actions">
        <button type="button" className="action-btn brief" onClick={onUpload}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload File
        </button>
      </div>
    </div>
  )
}
