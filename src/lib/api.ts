// Typed REST client for tadqeeq-backend.
//
// All paths are relative (/api/...) so they go through the Vite dev proxy
// in development and the same-origin reverse proxy in production. To point
// at a different backend, set VITE_BACKEND_URL in .env.

import type {
  BriefResult,
  ChatSummary,
  ClauseDetail,
  ComplianceResult,
  DocumentMetadata,
  HealthResponse,
  LibraryChatSummary,
  LibraryIndex,
  UserSettings,
} from './types'

const API_KEY_STORAGE = 'tadqeeq.apiKey'

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? ''
}

export function setApiKey(key: string): void {
  if (key) localStorage.setItem(API_KEY_STORAGE, key)
  else localStorage.removeItem(API_KEY_STORAGE)
}

class ApiError extends Error {
  status: number
  body?: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers ?? {})
  const key = getApiKey()
  if (key) headers.set('Authorization', `Bearer ${key}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(path, { ...init, headers })
  if (!res.ok) {
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      try { body = await res.text() } catch { /* swallow */ }
    }
    const detail =
      (body && typeof body === 'object' && 'detail' in body && typeof (body as { detail: unknown }).detail === 'string')
        ? (body as { detail: string }).detail
        : res.statusText
    throw new ApiError(res.status, `${res.status} ${detail}`, body)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export interface ChatDetail {
  id: string
  created?: string
  updated?: string
  preview?: string
  messages: import('./types').ChatMessage[]
}

export interface LibraryChatDetail extends ChatDetail {
  category_id?: string | null
}

export const api = {
  health: () => request<HealthResponse>('/health'),

  // Chat history
  newChat: () => request<{ id: string }>('/api/chats', { method: 'POST', body: '{}' }),
  listChats: (limit = 20) =>
    request<{ chats: ChatSummary[] }>(`/api/chats?limit=${limit}`),
  getChat: (id: string) => request<ChatDetail>(`/api/chats/${id}`),
  deleteChat: (id: string) => request<void>(`/api/chats/${id}`, { method: 'DELETE' }),

  // Library
  libraryIndex: () => request<LibraryIndex>('/api/library/index'),
  clause: (id: string) => request<ClauseDetail>(`/api/library/clause/${id}`),
  newLibraryChat: (categoryId?: string | null) =>
    request<{ id: string }>('/api/library/chats', {
      method: 'POST',
      body: JSON.stringify({ category_id: categoryId ?? null }),
    }),
  listLibraryChats: (limit = 20) =>
    request<{ chats: LibraryChatSummary[] }>(`/api/library/chats?limit=${limit}`),
  getLibraryChat: (id: string) => request<LibraryChatDetail>(`/api/library/chats/${id}`),
  deleteLibraryChat: (id: string) =>
    request<void>(`/api/library/chats/${id}`, { method: 'DELETE' }),

  // Analysis
  uploadDocument: async (file: File): Promise<DocumentMetadata> => {
    const fd = new FormData()
    fd.append('file', file)
    const headers: Record<string, string> = {}
    const key = getApiKey()
    if (key) headers.Authorization = `Bearer ${key}`
    const res = await fetch('/api/analysis/documents', {
      method: 'POST',
      headers,
      body: fd,
    })
    if (!res.ok) {
      let detail = res.statusText
      try {
        const body = (await res.json()) as { detail?: string }
        if (body?.detail) detail = body.detail
      } catch { /* ignore */ }
      throw new ApiError(res.status, `${res.status} ${detail}`)
    }
    return (await res.json()) as DocumentMetadata
  },
  getDocument: (id: string) => request<DocumentMetadata>(`/api/analysis/documents/${id}`),
  deleteDocument: (id: string) =>
    request<void>(`/api/analysis/documents/${id}`, { method: 'DELETE' }),
  runCompliance: (id: string, strictness?: string) =>
    request<ComplianceResult>(`/api/analysis/documents/${id}/compliance`, {
      method: 'POST',
      body: JSON.stringify({ strictness: strictness ?? 'standard' }),
    }),
  getCompliance: (id: string) =>
    request<ComplianceResult>(`/api/analysis/documents/${id}/compliance`),
  runBrief: (id: string, reportLanguage?: string) =>
    request<BriefResult>(`/api/analysis/documents/${id}/brief`, {
      method: 'POST',
      body: JSON.stringify({ report_language: reportLanguage ?? 'auto' }),
    }),
  getBrief: (id: string) => request<BriefResult>(`/api/analysis/documents/${id}/brief`),

  // Settings
  getSettings: () => request<UserSettings>('/api/settings'),
  patchSettings: (patch: Partial<UserSettings>) =>
    request<UserSettings>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
}

// ─── Binary downloads (exports) ───────────────────────────────────────
// Used for the Save Report flow. fetch() the export URL with auth headers,
// turn the response into a Blob, simulate an anchor click to trigger the
// browser's file save dialog. Naming comes from Content-Disposition when
// the server sets it; fall back to the suggested filename.

export async function downloadExport(url: string, suggestedFilename: string): Promise<void> {
  const headers: Record<string, string> = {}
  const key = getApiKey()
  if (key) headers.Authorization = `Bearer ${key}`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { detail?: string }
      if (body?.detail) detail = body.detail
    } catch { /* ignore */ }
    throw new ApiError(res.status, `${res.status} ${detail}`)
  }
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition') ?? ''
  const match = cd.match(/filename="?([^"]+)"?/i)
  const name = match ? match[1] : suggestedFilename
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}

export { ApiError }
