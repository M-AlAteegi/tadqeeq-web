// Header-mounted filter button + dropdown. Only renders when analysis
// mode is active AND the sidebar is collapsed — otherwise the same
// settings are reachable via the sidebar cards directly.
//
// Dropdown content is intentionally the SAME AnalysisSidebarSettings
// the sidebar uses, so the user sees one stable settings UI instead of
// learning a new layout for the popover variant.

import { useEffect, useRef, useState } from 'react'
import { AnalysisSidebarSettings } from './AnalysisSidebarSettings'

const FILTER_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
    <path d="M7 11.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5" />
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
