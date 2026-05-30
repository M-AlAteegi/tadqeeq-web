// v3.2-faithful: #analysisSidebar > Compliance + Brief settings cards.
// Compliance card writes report_language + date_format; Brief card writes
// brief_language + brief_date_format (independent backend keys, no cross-sync).

import { useEffect, useState } from 'react'
import { api } from '../lib/api'
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
    return (
      <div className="ana-section-title" style={{ padding: '12px 4px' }}>
        Loading settings…
      </div>
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
            Audit Rigor
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
            Strictness
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
            Report Language
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
          <span className="ana-setting-label">Date Format</span>
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
            Report Language
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
          <span className="ana-setting-label">Date Format</span>
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
