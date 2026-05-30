import type { ChatMessage } from '../lib/types'
import { Markdown } from '../lib/markdown'
import { SourcePill } from './SourcePill'

interface Props {
  message: ChatMessage
  isStreaming?: boolean
}

export function Message({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'
  return (
    <div className="flex flex-col mb-6">
      <div
        className="text-xs font-semibold mb-1.5 px-1"
        style={{
          color: isUser
            ? 'var(--color-app-text-dim)'
            : 'var(--color-accent-chat)',
        }}
      >
        {isUser ? 'You' : 'TadqeeqAI'}
        {!isUser && message.regulator && message.regulator !== 'NONE' && (
          <span
            className="ml-2 px-1.5 py-0.5 rounded text-xs"
            style={{
              background: 'var(--color-app-card-hover)',
              color: 'var(--color-app-text-dim)',
            }}
          >
            {message.regulator}
          </span>
        )}
      </div>
      <div
        className="rounded-lg px-4 py-3 text-sm leading-relaxed"
        style={{
          background: isUser ? 'transparent' : 'var(--color-app-card)',
          border: isUser
            ? '1px solid var(--color-app-border)'
            : '1px solid transparent',
          color: 'var(--color-app-text)',
        }}
      >
        {isUser ? (
          <div dir="auto" style={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </div>
        ) : (
          <>
            <Markdown content={message.content || (isStreaming ? '…' : '')} />
            {isStreaming && (
              <span
                className="inline-block w-2 h-3 ml-1 align-baseline animate-pulse"
                style={{ background: 'var(--color-accent-chat)' }}
                aria-hidden="true"
              />
            )}
          </>
        )}
      </div>
      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="mt-2 px-1">
          {message.sources.map((s, i) => (
            <SourcePill key={`${s.article}-${i}`} source={s} />
          ))}
        </div>
      )}
    </div>
  )
}
