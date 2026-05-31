// Top-level analysis view. Three visible states:
//   1. empty   — no doc uploaded; show AnalysisWelcome + EmptyUploadBar
//   2. loaded  — doc uploaded but no report yet; show AnalysisWelcome + DocControls
//   3. report  — compliance OR brief result rendered; show that + DocControls
//
// Settings (rigor / strictness / report_language) are fetched once on mount
// and re-read just before runCompliance / runBrief so the user's latest
// sidebar pick is always honored. The cards also receive the preference so
// chrome language follows the setting (not just the document's language).

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { AnalysisBriefCard } from './AnalysisBriefCard'
import { AnalysisComplianceCard } from './AnalysisComplianceCard'
import { AnalysisDocControls } from './AnalysisDocControls'
import { AnalysisDropOverlay } from './AnalysisDropOverlay'
import { AnalysisEmptyBar } from './AnalysisEmptyBar'
import { AnalysisWelcome } from './AnalysisWelcome'
import { useToast } from './Toast'
import type { AnalysisSaveBundle } from './Header'
import type {
  BriefResult,
  ComplianceResult,
  DocumentMetadata,
  UserSettings,
} from '../lib/types'

type Report = 'compliance' | 'brief' | null

interface Props {
  // Lifted up so Header can render Save Report in v3.2 position.
  onSaveBundleChange?: (bundle: AnalysisSaveBundle | null) => void
}

export function AnalysisView({ onSaveBundleChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [doc, setDoc] = useState<DocumentMetadata | null>(null)
  const [report, setReport] = useState<Report>(null)
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null)
  const [brief, setBrief] = useState<BriefResult | null>(null)
  const [isRunning, setIsRunning] = useState<'compliance' | 'brief' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const toast = useToast()

  // Sidebar persists settings on each change but lives in its own React
  // tree, so the AnalysisView snapshot needs a refresh on mount and
  // whenever the user runs a scan or brief (which is the moment they
  // care that their pick is honored).
  const refreshSettings = useCallback(() => {
    api.getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  async function handleFile(file: File) {
    setError(null)
    try {
      const meta = await api.uploadDocument(file)
      setDoc(meta)
      setCompliance(null)
      setBrief(null)
      setReport(null)
      toast.show(`Uploaded "${meta.filename}"`)
    } catch (e) {
      // Strip the leading "Error: " prefix our request() wrapper adds so
      // the toast reads cleanly. Backend usually returns concrete
      // messages ("file too large", "unsupported file type", etc.).
      const raw = String((e as { message?: string })?.message ?? e)
      const msg = raw.replace(/^error:\s*/i, '').trim() || 'Upload failed'
      setError(`Upload failed: ${msg}`)
      toast.show(`Upload failed — ${msg}`, 'info')
    }
  }

  async function handleScan() {
    if (!doc) return
    setIsRunning('compliance')
    setError(null)
    try {
      // Pull the latest sidebar pick — user may have changed strictness
      // since the AnalysisView mounted.
      const fresh = await api.getSettings().catch(() => settings)
      if (fresh) setSettings(fresh)
      const result = await api.runCompliance(doc.id, fresh?.strictness ?? 'standard')
      setCompliance(result)
      setReport('compliance')
    } catch (e) {
      setError(`Compliance scan failed: ${e}`)
    } finally {
      setIsRunning(null)
    }
  }

  async function handleBrief() {
    if (!doc) return
    setIsRunning('brief')
    setError(null)
    try {
      const fresh = await api.getSettings().catch(() => settings)
      if (fresh) setSettings(fresh)
      const result = await api.runBrief(doc.id, fresh?.brief_language ?? 'auto')
      setBrief(result)
      setReport('brief')
    } catch (e) {
      setError(`Brief generation failed: ${e}`)
    } finally {
      setIsRunning(null)
    }
  }

  async function handleRemove() {
    if (!doc) return
    try {
      await api.deleteDocument(doc.id)
    } catch {
      /* still clear locally even if backend delete fails */
    }
    setDoc(null)
    setCompliance(null)
    setBrief(null)
    setReport(null)
    setError(null)
  }

  function handleDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      setDragActive(true)
    }
  }
  function handleDragLeave(e: React.DragEvent) {
    if (e.currentTarget === e.target) setDragActive(false)
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      handleFile(f)
      e.target.value = ''
    }
  }

  // Save menus — backend export endpoints honor the user's date_format
  // pick for both, and the compliance lang query-param overrides
  // doc_language so saving an EN-locked AR-doc report comes out in EN.
  const briefDF = settings?.brief_date_format ?? 'dual'
  const complDF = settings?.date_format ?? 'dual'
  const complLang = settings?.report_language ?? 'auto'

  // Push the active report's export URLs up to App so the Header renders
  // the Save button in the v3.2 spot. Clearing on unmount keeps the
  // Header tidy when the user switches away from analysis mode.
  useEffect(() => {
    if (!onSaveBundleChange) return
    if (!doc) {
      onSaveBundleChange(null)
      return
    }
    if (report === 'compliance') {
      onSaveBundleChange({
        urls: {
          pdf: `/api/analysis/documents/${doc.id}/compliance/export/pdf?date_format=${complDF}&lang=${complLang}`,
          docx: `/api/analysis/documents/${doc.id}/compliance/export/docx?date_format=${complDF}&lang=${complLang}`,
          md: `/api/analysis/documents/${doc.id}/compliance/export/markdown?date_format=${complDF}&lang=${complLang}`,
        },
        baseName: `tadqeeq-compliance-${doc.filename}`,
        // Label stays "Save Report" regardless of report kind — the URLs
        // route to the right backend endpoint behind the scenes, so the
        // button doesn't need to switch identity on the user.
        buttonLabel: 'Save Report',
      })
    } else if (report === 'brief') {
      onSaveBundleChange({
        urls: {
          pdf: `/api/analysis/documents/${doc.id}/brief/export/pdf?date_format=${briefDF}`,
          docx: `/api/analysis/documents/${doc.id}/brief/export/docx?date_format=${briefDF}`,
          md: `/api/analysis/documents/${doc.id}/brief/export/markdown?date_format=${briefDF}`,
        },
        baseName: `tadqeeq-brief-${doc.filename}`,
        buttonLabel: 'Save Report',
      })
    } else {
      onSaveBundleChange(null)
    }
  }, [doc, report, complDF, complLang, briefDF, onSaveBundleChange])

  useEffect(() => {
    return () => onSaveBundleChange?.(null)
  }, [onSaveBundleChange])

  return (
    <>
      <AnalysisDropOverlay active={dragActive} />
      <div
        className="chat"
        id="chat"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {error && (
          <div
            style={{
              maxWidth: 700,
              margin: '20px auto 0',
              padding: '12px 18px',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 12,
              color: 'var(--danger)',
              fontSize: 13,
            }}
            role="alert"
          >
            {error}
          </div>
        )}
        {report === 'compliance' && compliance ? (
          <AnalysisComplianceCard
            result={compliance}
            reportLanguage={settings?.report_language ?? 'auto'}
          />
        ) : report === 'brief' && brief ? (
          <AnalysisBriefCard
            result={brief}
            filename={doc?.filename ?? 'Document'}
            reportLanguage={settings?.brief_language ?? 'auto'}
          />
        ) : (
          <AnalysisWelcome />
        )}
      </div>
      <div className="input-area">
        {doc ? (
          <AnalysisDocControls
            filename={doc.filename}
            onScan={handleScan}
            onBrief={handleBrief}
            onRemove={handleRemove}
            onUpload={openFilePicker}
            isRunning={isRunning}
          />
        ) : (
          <AnalysisEmptyBar onUpload={openFilePicker} />
        )}
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 10,
            color: 'var(--text3)',
            fontWeight: 600,
            userSelect: 'none',
          }}
        >
          AI can make mistakes. Verify important information.
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.docx,.doc"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </>
  )
}
