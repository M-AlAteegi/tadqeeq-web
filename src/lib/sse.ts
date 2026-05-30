// SSE-over-POST helper.
//
// The backend's streaming endpoints (/api/chat/query/stream,
// /api/library/query/stream) use POST so we can't use the browser's
// EventSource API (GET-only). We parse the text/event-stream body
// ourselves from a fetch ReadableStream.

import { getApiKey } from './api'

export interface SSEEvent {
  type: 'meta' | 'token' | 'done' | 'error' | 'chat'
  [k: string]: unknown
}

interface StreamOptions {
  signal?: AbortSignal
}

export async function* streamPOST(
  url: string,
  body: unknown,
  opts: StreamOptions = {},
): AsyncGenerator<SSEEvent, void, void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const key = getApiKey()
  if (key) headers.Authorization = `Bearer ${key}`

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: opts.signal,
  })
  if (!res.ok || !res.body) {
    let detail = res.statusText
    try {
      const errBody = (await res.json()) as { detail?: string }
      if (errBody?.detail) detail = errBody.detail
    } catch { /* ignore */ }
    throw new Error(`${res.status} ${detail}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE events are delimited by a blank line ("\n\n"). Process every
    // complete event in the buffer; keep the trailing partial for the
    // next chunk.
    let sepIdx: number
    while ((sepIdx = buffer.indexOf('\n\n')) >= 0) {
      const rawEvent = buffer.slice(0, sepIdx)
      buffer = buffer.slice(sepIdx + 2)
      const dataLine = rawEvent
        .split('\n')
        .find((l) => l.startsWith('data:'))
      if (!dataLine) continue
      const payload = dataLine.slice(5).trimStart()
      try {
        yield JSON.parse(payload) as SSEEvent
      } catch {
        // Malformed event — skip it rather than crashing the whole stream.
      }
    }
  }
}
