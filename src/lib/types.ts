// Shared types mirroring the backend Pydantic models. Keep field names
// identical so JSON deserialization is a no-op.

export type Mode = 'chat' | 'library' | 'analysis'

export interface CorpusStats {
  sama: number
  cma: number
  total: number
}

export interface HealthResponse {
  status: string
  service: string
  version: string
  llm_provider: string
  llm_model: string
  stats?: CorpusStats
}

export interface Source {
  article: string
  document: string
  title?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  sources?: Source[]
  regulator?: string | null
}

export interface ChatSummary {
  id: string
  preview: string
  updated?: string
  message_count?: number
  regulator?: string | null
}

export interface LibraryChatSummary extends ChatSummary {
  category_id?: string | null
}

export interface Category {
  id: string
  label_en: string
  label_ar?: string
  description_en?: string
  description_ar?: string
}

export interface ClauseSummary {
  id: string
  category: string
  type?: string
  title_en?: string
  title_ar?: string
  tags?: string[]
}

export interface ClauseDetail extends ClauseSummary {
  body_en?: string
  body_ar?: string
  source_note?: string
}

export interface LibraryIndex {
  categories: Category[]
  clauses: ClauseSummary[]
}

// ─── Analysis ─────────────────────────────────────────────────────────

export interface DocumentSummary {
  type: string
  has_arabic: boolean
  word_count: number
}

export interface DocumentMetadata {
  id: string
  filename: string
  uploaded_at: string
  page_count: number
  char_count: number
  summary?: DocumentSummary
  has_compliance: boolean
  has_brief: boolean
}

export interface ComplianceLocalized {
  name: string
  regulation: string
  description: string
  detail: string
}

export interface ComplianceCheck {
  id: string
  status: 'compliant' | 'warning'
  found_keywords: string[]
  pass_reason: string
  name: string
  regulation: string
  description: string
  detail: string
  localized: {
    en: ComplianceLocalized
    ar: ComplianceLocalized
  }
}

export interface ComplianceResult {
  filename: string
  timestamp: string
  doc_language: string
  score: number
  summary: { compliant: number; warnings: number; missing: number }
  checks: ComplianceCheck[]
}

export interface BriefResult {
  report: string
  localized: Record<string, string>
  primary: string
  language: string
}

// ─── User settings ────────────────────────────────────────────────────

export type RigorLevel = 'standard' | 'deep'
export type Strictness = 'standard' | 'critical_only'
export type ReportLanguage = 'auto' | 'en' | 'ar' | 'bilingual'
export type DateFormat = 'dual' | 'gregorian' | 'hijri'

export interface UserSettings {
  rigor_level: RigorLevel
  strictness: Strictness
  report_language: ReportLanguage
  date_format: DateFormat
  brief_language: ReportLanguage
  brief_date_format: DateFormat
}
