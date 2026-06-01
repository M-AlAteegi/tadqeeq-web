// v3.2-faithful: #analysisSidebar > Compliance + Brief settings cards.
// Compliance card writes report_language + date_format; Brief card writes
// brief_language + brief_date_format (independent backend keys, no cross-sync).

import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Skeleton } from './Skeleton'
import type { DateFormat, ReportLanguage, RigorLevel, Strictness, UserSettings } from '../lib/types'

const COMPLIANCE_ICON = (
  <svg viewBox="0 0 24 24">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const BRIEF_ICON = (
  <svg viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

const DATE_FORMATS: { value: DateFormat; label: string }[] = [
  { value: 'dual', label: 'Both' },
  { value: 'gregorian', label: 'Greg' },
  { value: 'hijri', label: 'Hijri' },
]

// Small inline icons leading each setting label. All sized 12x12 with a
// consistent baseline tweak (verticalAlign -2px) so the label text and
// the glyph share a baseline regardless of row.
const ICON_STYLE = { marginRight: 6, verticalAlign: '-2px' as const }

// Bootstrap calendar4-week — Date Format row.
const CALENDAR_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={ICON_STYLE} aria-hidden="true">
    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" />
    <path d="M11 7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-2 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z" />
  </svg>
)

// Bootstrap translate — Report Language rows (compliance + brief).
const LANGUAGE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={ICON_STYLE} aria-hidden="true">
    <path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286zm1.634-.736L5.5 3.956h-.049l-.679 2.022z" />
    <path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492 2 2 0 0 1-.94.31" />
  </svg>
)

// Clipboard + magnifying glass — Audit Rigor row.
const RIGOR_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={ICON_STYLE} aria-hidden="true">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <line x1="9" y1="10" x2="11" y2="10" />
    <line x1="9" y1="14" x2="11" y2="14" />
    <circle cx="16" cy="14" r="3" />
    <line x1="18.1" y1="16.1" x2="21" y2="19" />
  </svg>
)

// Bootstrap shield-fill-check — Strictness row. Stand-in for the
// Font Awesome shield-halved the user named; same authoritative read,
// and we don't have FA loaded.
const STRICTNESS_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={ICON_STYLE} aria-hidden="true">
    <path d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.8 11.8 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7 7 0 0 0 1.048-.625 11.8 11.8 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.54 1.54 0 0 0-1.044-1.263 63 63 0 0 0-2.887-.87C9.843.266 8.69 0 8 0m2.146 5.146a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793z" />
  </svg>
)

export function AnalysisSidebarSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  function persist(patch: Partial<UserSettings>) {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev))
    api.patchSettings(patch).catch(() => {
      // best-effort persistence; the user can re-toggle if it fails silently
    })
  }

  if (!settings) {
    // Skeleton mirrors the real two-card layout below so swap-in
    // doesn't reflow. One title block + two cards each carrying a
    // header row, two select rows, and a pill row.
    return (
      <>
        <div className="ana-section-title">Analysis Settings</div>
        {[0, 1].map((cardIdx) => (
          <div key={cardIdx} className="ana-card" style={{ gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Skeleton width={14} height={14} radius={4} />
              <Skeleton width={120} height={12} />
            </div>
            <Skeleton width="100%" height={30} radius={8} />
            <Skeleton width="100%" height={30} radius={8} />
            <Skeleton width="100%" height={28} radius={8} />
          </div>
        ))}
      </>
    )
  }

  return (
    <>
      <div className="ana-section-title">Analysis Settings</div>

      <div className="ana-card compliance">
        <div className="ana-card-head">
          {COMPLIANCE_ICON}
          <span>Compliance Scan</span>
        </div>
        <div className="ana-setting">
          <label className="ana-setting-label" htmlFor="anaSettingRigor">
            {RIGOR_ICON}Audit Rigor
          </label>
          <select
            id="anaSettingRigor"
            className="ana-setting-select"
            value={settings.rigor_level}
            onChange={(e) => persist({ rigor_level: e.target.value as RigorLevel })}
          >
            <option value="standard">Standard Audit</option>
            <option value="deep">Deep Review</option>
          </select>
        </div>
        <div className="ana-setting">
          <label className="ana-setting-label" htmlFor="anaSettingStrictness">
            {STRICTNESS_ICON}Strictness
          </label>
          <select
            id="anaSettingStrictness"
            className="ana-setting-select"
            value={settings.strictness}
            onChange={(e) => persist({ strictness: e.target.value as Strictness })}
          >
            <option value="standard">Flag Minor Deviations</option>
            <option value="critical_only">Critical Non-Compliance Only</option>
          </select>
        </div>
        <div className="ana-setting">
          <label className="ana-setting-label" htmlFor="anaSettingReportLangCompliance">
            {LANGUAGE_ICON}Report Language
          </label>
          <select
            id="anaSettingReportLangCompliance"
            className="ana-setting-select"
            value={settings.report_language}
            onChange={(e) => persist({ report_language: e.target.value as ReportLanguage })}
          >
            <option value="auto">Auto (match document)</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="bilingual">Bilingual (Side-by-Side)</option>
          </select>
        </div>
        <div className="ana-setting">
          <span className="ana-setting-label">{CALENDAR_ICON}Date Format</span>
          <div
            className="ana-setting-pills"
            role="radiogroup"
            aria-label="Date format"
            data-ana-pill-group="compliance"
          >
            {DATE_FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={
                  settings.date_format === f.value ? 'ana-setting-pill active' : 'ana-setting-pill'
                }
                data-ana-fmt={f.value}
                onClick={() => persist({ date_format: f.value })}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ana-card brief">
        <div className="ana-card-head">
          {BRIEF_ICON}
          <span>Executive Brief</span>
        </div>
        <div className="ana-setting">
          <label className="ana-setting-label" htmlFor="anaSettingReportLang">
            {LANGUAGE_ICON}Report Language
          </label>
          <select
            id="anaSettingReportLang"
            className="ana-setting-select"
            value={settings.brief_language}
            onChange={(e) => persist({ brief_language: e.target.value as ReportLanguage })}
          >
            <option value="auto">Auto (match document)</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="bilingual">Bilingual (Side-by-Side)</option>
          </select>
        </div>
        <div className="ana-setting">
          <span className="ana-setting-label">{CALENDAR_ICON}Date Format</span>
          <div
            className="ana-setting-pills"
            role="radiogroup"
            aria-label="Date format"
            data-ana-pill-group="brief"
          >
            {DATE_FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={
                  settings.brief_date_format === f.value
                    ? 'ana-setting-pill active'
                    : 'ana-setting-pill'
                }
                data-ana-fmt={f.value}
                onClick={() => persist({ brief_date_format: f.value })}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
