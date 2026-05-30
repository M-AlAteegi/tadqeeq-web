// Shared types mirroring the backend Pydantic models. Keep field names
// identical so JSON deserialization is a no-op.

export type Mode = 'chat' | 'library' | 'analysis'

export interface HealthResponse {
  status: string
  service: string
  version: string
  llm_provider: string
  llm_model: string
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
