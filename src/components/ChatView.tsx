import { useEffect, useRef, useState } from 'react'
import { ApiError, api, humanizeError } from '../lib/api'
import { streamPOST } from '../lib/sse'
import type { ChatMessage, CorpusStats, Source } from '../lib/types'
import { MessageList } from './MessageList'
import { Composer } from './Composer'
import { WelcomeView } from './WelcomeView'
import { ScrollToBottomButton } from './ScrollToBottomButton'
import { useToast } from './Toast'

interface Props {
  chatId: string | null
  onChatCreated: (id: string) => void
  onChatTouched: () => void
  stats?: CorpusStats
  // True while the backend is still booting (corpus / embeddings loading).
  // WelcomeView shows an init overlay so the user knows why stats are
  // blank for the first ~15s on a cold start.
  isInitializing?: boolean
  pendingPrompt?: string | null
  onPromptConsumed?: () => void
  // Composer attach-button click — App handles the mode swap + picker
  // open; ChatView just forwards the intent.
  onAttach?: () => void
  // Called when the active chat 404s on load — typically because it
  // was deleted in another tab. App clears the active id so we drop
  // back to the welcome view instead of staring at an empty messages
  // list with a dangling chatId in state.
  onChatGone?: () => void
}

export function ChatView({
  chatId,
  onChatCreated,
  onChatTouched,
  stats,
  isInitializing,
  pendingPrompt,
  onPromptConsumed,
  onAttach,
  onChatGone,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const toast = useToast()
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
      .catch((e) => {
        if (cancelled) return
        setMessages([])
        // 404 = the chat record is gone (deleted from another tab, or
        // wiped on a backend redeploy without a persistent volume).
        // Drop the dangling id so the welcome view takes over instead
        // of leaving the user with an empty chat surface.
        if (e instanceof ApiError && e.status === 404) {
          toast.show('Chat no longer exists', 'info')
          onChatGone?.()
        }
      })
    return () => {
      cancelled = true
    }
  }, [chatId, onChatGone, toast])

  async function handleSend(text: string) {
    // Guard against double-fire — rapid Enter / click between submit
    // and the next render's isStreaming=true would otherwise queue a
    // second request on top of the in-flight one.
    if (abortRef.current) return
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
      // Stream completed cleanly but produced no content — happens if
      // the provider returns an empty result or hits an empty-response
      // safety filter. Surface as a retryable error instead of leaving
      // the user with a blank bubble.
      if (!acc.trim()) {
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          copy[copy.length - 1] = { ...last, error: 'No response generated. Try rephrasing the question.' }
          return copy
        })
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        const friendly = humanizeError(err)
        // Stash the error on the message itself so Message can render an
        // inline retry card next to whatever partial content arrived.
        // Append a toast for the rate-limit case so the wait time is
        // visible even if the user scrolled away from the bubble.
        if (err instanceof ApiError && err.status === 429) {
          toast.show(friendly, 'info')
        }
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          copy[copy.length - 1] = { ...last, error: friendly }
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

  // Retry the prompt that produced a failed assistant message. We
  // grab the user message immediately preceding the assistant one (the
  // standard alternating order), drop the failed bubble + its user
  // pair, and rerun handleSend with the original text. Wrapped in a
  // single setMessages so React doesn't paint an interim "ghost" state.
  function handleRetry(assistantIndex: number) {
    if (isStreaming) return
    const userIdx = assistantIndex - 1
    const userMsg = messages[userIdx]
    if (!userMsg || userMsg.role !== 'user') return
    const prompt = userMsg.content
    setMessages((prev) => prev.slice(0, userIdx))
    handleSend(prompt)
  }

  // Consume "Try These" suggestion when it lands. Wait for ChatView to be
  // in an idle state (no streaming, no active chat) so we don't blow away
  // an in-flight response.
  useEffect(() => {
    if (!pendingPrompt || isStreaming || chatId) return
    handleSend(pendingPrompt)
    onPromptConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt, isStreaming, chatId])

  if (!chatId && messages.length === 0 && !isStreaming) {
    return (
      <>
        <div className="chat" id="chat">
          <WelcomeView mode="chat" stats={stats} isInitializing={isInitializing} />
        </div>
        {/* key forces a remount whenever we toggle welcome ↔ messages,
            so ScrollToBottomButton's effect re-binds to the fresh #chat
            DOM node. Without this, the button captures the first #chat
            element it sees on mount and silently stops working once the
            React tree swaps in MessageList's div. */}
        <ScrollToBottomButton key="chat-welcome" targetId="chat" />
        <Composer onSend={handleSend} onAttach={onAttach} />
      </>
    )
  }

  return (
    <>
      <MessageList messages={messages} streamingIndex={streamingIndex} onRetry={handleRetry} />
      <ScrollToBottomButton key={`chat-msg-${chatId ?? 'fresh'}`} targetId="chat" />
      <Composer
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
        onAttach={onAttach}
      />
    </>
  )
}
