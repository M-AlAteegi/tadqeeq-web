import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../lib/types'
import { Message } from './Message'

interface Props {
  messages: ChatMessage[]
  streamingIndex?: number | null
  // Called with the index of the assistant message whose retry button
  // was clicked. Parent re-issues the matching user prompt.
  onRetry?: (assistantIndex: number) => void
}

export function MessageList({ messages, streamingIndex, onRetry }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const userScrolledUpRef = useRef(false)

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, streamingIndex])

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledUpRef.current = distanceFromBottom > 120
  }

  return (
    <div
      className="chat"
      id="chat"
      role="log"
      aria-live="polite"
      aria-label="Conversation"
      onScroll={handleScroll}
    >
      {messages.map((m, i) => (
        <Message
          key={i}
          message={m}
          isStreaming={i === streamingIndex}
          onRetry={m.error && onRetry ? () => onRetry(i) : undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
