// v3.2-faithful: .drop-overlay shown when dragging a file over the main panel.

interface Props {
  active: boolean
}

export function AnalysisDropOverlay({ active }: Props) {
  return (
    <div
      id="dropOverlay"
      className={active ? 'drop-overlay active' : 'drop-overlay'}
    >
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Drop Document</h3>
        <p style={{ color: 'var(--text2)', fontSize: 15, marginTop: 8 }}>
          PDF or DOCX (max 50 pages)
        </p>
      </div>
    </div>
  )
}
