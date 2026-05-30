import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../lib/types'
import { Message } from './Message'

interface Props {
  messages: ChatMessage[]
  streamingIndex?: number | null
}

export function MessageList({ messages, streamingIndex }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const userScrolledUpRef = useRef(false)

  // Auto-scroll to the latest message only when the user hasn't manually
  // scrolled up — respecting their position lets them read earlier turns
  // mid-stream without the page yanking them down.
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
      className="flex-1 overflow-y-auto"
      onScroll={handleScroll}
    >
      <div className="max-w-3xl mx-auto px-6 py-8">
        {messages.map((m, i) => (
          <Message
            key={i}
            message={m}
            isStreaming={i === streamingIndex}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
