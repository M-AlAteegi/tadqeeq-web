// Header-mounted filter button + dropdown. Only renders when analysis
// mode is active AND the sidebar is collapsed — otherwise the same
// settings are reachable via the sidebar cards directly.
//
// Dropdown content is intentionally the SAME AnalysisSidebarSettings
// the sidebar uses, so the user sees one stable settings UI instead of
// learning a new layout for the popover variant.

import { useEffect, useRef, useState } from 'react'
import { AnalysisSidebarSettings } from './AnalysisSidebarSettings'

// Plain Bootstrap bi-filter — lines without the circle wrapper. Reads
// cleaner inside the small circular header button than the filter-circle
// variant (which doubled up the ring with the button's border).
const FILTER_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5" />
  </svg>
)

export function AnalysisHeaderFilterButton() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="header-filter-btn"
        title="Analysis settings"
        aria-label="Open analysis settings"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {FILTER_ICON}
      </button>
      {open && (
        <div className="header-filter-menu">
          <AnalysisSidebarSettings />
        </div>
      )}
    </div>
  )
}
