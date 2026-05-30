import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { streamPOST } from '../lib/sse'
import type { ChatMessage, CorpusStats, Source } from '../lib/types'
import { MessageList } from './MessageList'
import { Composer } from './Composer'
import { WelcomeView } from './WelcomeView'

interface Props {
  chatId: string | null
  onChatCreated: (id: string) => void
  onChatTouched: () => void
  stats?: CorpusStats
}

export function ChatView({ chatId, onChatCreated, onChatTouched, stats }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // When a fresh send triggers api.newChat() inside handleSend, the resulting
  // chatId prop change re-runs this useEffect, which would abort the just-
  // started stream and overwrite our optimistic bubbles with an empty
  // getChat() response. skipLoadRef carries the id of any chat we created
  // ourselves so we know to skip the load+reset for THAT specific transition.
  const skipLoadRef = useRef<string | null>(null)

  useEffect(() => {
    if (chatId && skipLoadRef.current === chatId) {
      skipLoadRef.current = null
      return
    }
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
    setStreamingIndex(null)
    if (!chatId) {
      setMessages([])
      return
    }
    let cancelled = false
    api
      .getChat(chatId)
      .then((c) => {
        if (!cancelled) setMessages(c.messages ?? [])
      })
      .catch(() => {
        if (!cancelled) setMessages([])
      })
    return () => {
      cancelled = true
    }
  }, [chatId])

  async function handleSend(text: string) {
    let activeId = chatId
    if (!activeId) {
      try {
        const created = await api.newChat()
        activeId = created.id
        // Mark this id as "ours" BEFORE notifying the parent — when the
        // prop change comes back through useEffect, we skip the abort+load.
        skipLoadRef.current = activeId
        onChatCreated(activeId)
      } catch {
        return
      }
    }

    const userMsg: ChatMessage = { role: 'user', content: text }
    const assistantPlaceholder: ChatMessage = { role: 'assistant', content: '' }

    setMessages((prev) => {
      const next = [...prev, userMsg, assistantPlaceholder]
      setStreamingIndex(next.length - 1)
      return next
    })
    setIsStreaming(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl
    let acc = ''
    let lastSources: Source[] = []
    let lastRegulator: string | null = null

    try {
      for await (const event of streamPOST(
        '/api/chat/query/stream',
        { question: text, chat_id: activeId },
        { signal: ctrl.signal },
      )) {
        if (event.type === 'meta') {
          lastSources = (event.sources as Source[]) ?? []
          lastRegulator = (event.regulator as string) ?? null
          setMessages((prev) => {
            const copy = [...prev]
            const last = copy[copy.length - 1]
            copy[copy.length - 1] = {
              ...last,
              sources: lastSources,
              regulator: lastRegulator,
            }
            return copy
          })
        } else if (event.type === 'token') {
          acc += String(event.text ?? '')
          setMessages((prev) => {
            const copy = [...prev]
            copy[copy.length - 1] = { ...copy[copy.length - 1], content: acc }
            return copy
          })
        } else if (event.type === 'error') {
          throw new Error(String(event.message ?? 'stream error'))
        }
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        const msg = String(err)
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          copy[copy.length - 1] = {
            ...last,
            content: (last.content || '') + `\n\n_Error: ${msg}_`,
          }
          return copy
        })
      }
    } finally {
      setIsStreaming(false)
      setStreamingIndex(null)
      abortRef.current = null
      onChatTouched()
    }
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  if (!chatId && messages.length === 0 && !isStreaming) {
    return (
      <>
        <div className="chat" id="chat">
          <WelcomeView mode="chat" stats={stats} />
        </div>
        <Composer onSend={handleSend} />
      </>
    )
  }

  return (
    <>
      <MessageList messages={messages} streamingIndex={streamingIndex} />
      <Composer
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
      />
    </>
  )
}
