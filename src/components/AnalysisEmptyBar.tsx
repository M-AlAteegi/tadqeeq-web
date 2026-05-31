// Pre-upload state: only the purple Upload-file button is visible.
// The user explicitly asked for the .doc-controls bar chrome to stay
// hidden until a document is actually present — the bar's tinted
// background was reading as "info available" when there's nothing
// to show yet. After upload, AnalysisDocControls renders the full bar.

interface Props {
  onUpload: () => void
}

export function AnalysisEmptyBar({ onUpload }: Props) {
  return (
    <div
      id="analysisEmptyBar"
      style={{ display: 'flex', justifyContent: 'center', padding: '0 0 4px' }}
    >
      <button type="button" className="action-btn brief" onClick={onUpload}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8.5 11.5a.5.5 0 0 1-1 0V7.707L6.354 8.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 7.707z" />
          <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
        </svg>
        Upload file
      </button>
    </div>
  )
}
