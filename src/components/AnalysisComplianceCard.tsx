// v3.2-faithful: .compliance-wrapper > .comp-card with score box + .comp-list.
// Bilingual chrome — AR cards get .comp-list.ar modifier + dir="rtl" so the
// v3 CSS RTL rules (Noto Naskh, right-align) light up automatically.

import type { ComplianceCheck, ComplianceResult } from '../lib/types'

interface Props {
  result: ComplianceResult
}

const CHECK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const WARN_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12" y2="16" />
  </svg>
)

const ARABIC_RE = /[؀-ۿ]/

interface Chrome {
  title: string
  scoreLabel: string
  dir: 'ltr' | 'rtl'
}

const CHROME: Record<'en' | 'ar', Chrome> = {
  en: { title: 'Compliance Scan', scoreLabel: 'Compliant', dir: 'ltr' },
  ar: { title: 'تدقيق الامتثال', scoreLabel: 'متوافق', dir: 'rtl' },
}

function pickChrome(r: ComplianceResult): Chrome {
  const docLang = (r.doc_language === 'ar' ? 'ar' : 'en') as 'en' | 'ar'
  let chromeLang: 'en' | 'ar' = docLang
  // Defensive RTL fallback: if the check content carries Arabic and we
  // resolved to EN chrome, flip — we never want Arabic glyphs inside an
  // LTR container with EN alignment rules.
  if (chromeLang !== 'ar') {
    const looksArabic = r.checks.some(
      (c) => ARABIC_RE.test(c.name) || ARABIC_RE.test(c.regulation) || ARABIC_RE.test(c.detail),
    )
    if (looksArabic) chromeLang = 'ar'
  }
  return CHROME[chromeLang]
}

function scoreColor(score: number): { color: string; dim: string } {
  if (score >= 80) return { color: '#3fb950', dim: 'rgba(63, 185, 80, 0.2)' }
  if (score >= 50) return { color: '#ffbd2e', dim: 'rgba(255, 189, 46, 0.2)' }
  return { color: '#ff453a', dim: 'rgba(255, 69, 58, 0.2)' }
}

function statusLabel(c: ComplianceCheck, lang: 'en' | 'ar'): string {
  if (lang === 'ar') return c.status === 'compliant' ? 'ناجح' : 'تحذير'
  return c.status === 'compliant' ? 'PASS' : 'WARN'
}

export function AnalysisComplianceCard({ result }: Props) {
  const chrome = pickChrome(result)
  const isRtl = chrome.dir === 'rtl'
  const itemDir: 'rtl' | 'auto' = isRtl ? 'rtl' : 'auto'
  const { color, dim } = scoreColor(result.score)
  const listClass = isRtl ? 'comp-list ar' : 'comp-list'

  return (
    <div className="compliance-wrapper" style={{ marginTop: 40 }} dir={chrome.dir}>
      <div
        className="comp-card"
        style={
          {
            ['--score-color' as string]: color,
            ['--score-dim' as string]: dim,
          } as React.CSSProperties
        }
      >
        <div className="comp-header">
          <div className="comp-title">
            <h2>{chrome.title}</h2>
            <p dir="auto">{result.filename}</p>
          </div>
          <div className="score-box">
            <div className="score-val" dir={chrome.dir}>
              {result.score}%
            </div>
            <div className="score-lbl">{chrome.scoreLabel}</div>
          </div>
        </div>
        <div className={listClass} dir={chrome.dir}>
          {result.checks.map((c) => {
            const isPass = c.status === 'compliant'
            const iconStyle = isPass
              ? { color: '#3fb950', background: 'rgba(63,185,80,0.15)' }
              : { color: '#ffbd2e', background: 'rgba(255,189,46,0.15)' }
            const statusCls = isPass ? 'comp-status pass' : 'comp-status warn'
            // Pick the localized strings explicitly from .localized so a
            // chrome flip from EN→AR (or vice versa) re-renders against the
            // right strings without a backend round-trip.
            const loc =
              c.localized && c.localized[isRtl ? 'ar' : 'en']
                ? c.localized[isRtl ? 'ar' : 'en']
                : { name: c.name, regulation: c.regulation, description: c.description, detail: c.detail }
            return (
              <div key={c.id} className="comp-item" dir={itemDir}>
                <div className="comp-icon" style={iconStyle}>
                  {isPass ? CHECK_ICON : WARN_ICON}
                </div>
                <div className="comp-body" dir={itemDir}>
                  <div className="comp-name" dir={itemDir}>
                    {loc.name}
                    <span className={statusCls} dir={itemDir}>
                      {statusLabel(c, isRtl ? 'ar' : 'en')}
                    </span>
                  </div>
                  <div className="comp-reg" dir={itemDir}>
                    {loc.regulation}
                  </div>
                  <div className="comp-detail rule-description" dir={itemDir}>
                    {loc.detail}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
