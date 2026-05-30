// Top-level analysis view. Three visible states:
//   1. empty   — no doc uploaded; show AnalysisWelcome + EmptyUploadBar
//   2. loaded  — doc uploaded but no report yet; show AnalysisWelcome + DocControls
//   3. report  — compliance OR brief result rendered; show that + DocControls
//
// File upload happens via a hidden <input type="file"> + drag-and-drop on
// the main panel. .doc-controls (loaded) sits in .input-area; the compliance
// /brief result replaces the welcome inside the .chat scroll area.

import { useCallback, useRef, useState } from 'react'
import { api } from '../lib/api'
import { AnalysisBriefCard } from './AnalysisBriefCard'
import { AnalysisComplianceCard } from './AnalysisComplianceCard'
import { AnalysisDocControls } from './AnalysisDocControls'
import { AnalysisDropOverlay } from './AnalysisDropOverlay'
import { AnalysisEmptyBar } from './AnalysisEmptyBar'
import { AnalysisWelcome } from './AnalysisWelcome'
import type { BriefResult, ComplianceResult, DocumentMetadata } from '../lib/types'

type Report = 'compliance' | 'brief' | null

export function AnalysisView() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [doc, setDoc] = useState<DocumentMetadata | null>(null)
  const [report, setReport] = useState<Report>(null)
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null)
  const [brief, setBrief] = useState<BriefResult | null>(null)
  const [isRunning, setIsRunning] = useState<'compliance' | 'brief' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

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
    } catch (e) {
      setError(`Upload failed: ${e}`)
    }
  }

  async function handleScan() {
    if (!doc) return
    setIsRunning('compliance')
    setError(null)
    try {
      const result = await api.runCompliance(doc.id)
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
      const result = await api.runBrief(doc.id)
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
          <AnalysisComplianceCard result={compliance} />
        ) : report === 'brief' && brief ? (
          <AnalysisBriefCard result={brief} filename={doc?.filename ?? 'Document'} />
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
