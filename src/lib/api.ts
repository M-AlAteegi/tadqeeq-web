// Typed REST client for tadqeeq-backend.
//
// All paths are relative (/api/...) so they go through the Vite dev proxy
// in development and the same-origin reverse proxy in production. To point
// at a different backend, set VITE_BACKEND_URL in .env.

import type {
  ChatSummary,
  ClauseDetail,
  HealthResponse,
  LibraryChatSummary,
  LibraryIndex,
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

export const api = {
  health: () => request<HealthResponse>('/health'),

  // Chat history
  newChat: () => request<{ id: string }>('/api/chats', { method: 'POST', body: '{}' }),
  listChats: (limit = 20) =>
    request<{ chats: ChatSummary[] }>(`/api/chats?limit=${limit}`),
  deleteChat: (id: string) => request<void>(`/api/chats/${id}`, { method: 'DELETE' }),

  // Library
  libraryIndex: () => request<LibraryIndex>('/api/library/index'),
  clause: (id: string) => request<ClauseDetail>(`/api/library/clause/${id}`),
  listLibraryChats: (limit = 20) =>
    request<{ chats: LibraryChatSummary[] }>(`/api/library/chats?limit=${limit}`),
}

export { ApiError }
