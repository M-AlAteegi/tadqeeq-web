import type { ChatMessage } from '../lib/types'
import { Markdown } from '../lib/markdown'
import { SourcePill } from './SourcePill'

interface Props {
  message: ChatMessage
  isStreaming?: boolean
}

const ARABIC_RE = /[؀-ۿ]/
function detectDir(text: string): 'rtl' | 'ltr' | undefined {
  if (!text) return undefined
  const arabicCount = (text.match(/[؀-ۿ]/g) ?? []).length
  return arabicCount > text.length * 0.3 ? 'rtl' : undefined
}

const USER_AVATAR_SVG = (
  <svg viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)
const AI_AVATAR_SVG = (
  <svg viewBox="0 0 24 24">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
)

export function Message({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'
  const dir = detectDir(message.content)
  const isArabic = ARABIC_RE.test(message.content) && (dir === 'rtl')

  const cls = `msg ${isUser ? 'user' : 'assistant'}${isStreaming ? ' streaming' : ''}`
  const textCls = `msg-text${isArabic ? ' msg-text-ar' : ''}`
  const textProps = dir ? { dir } : {}

  return (
    <div className={cls}>
      <div className="avatar">
        {isUser ? USER_AVATAR_SVG : AI_AVATAR_SVG}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={textCls} {...textProps}>
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          ) : (
            <>
              {message.content ? (
                <Markdown content={message.content} />
              ) : (
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              )}
            </>
          )}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="sources-area">
              <div className="sources-title">Sources</div>
              <div className="sources-list">
                {message.sources.map((s, i) => (
                  <SourcePill key={`${s.article}-${i}`} source={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
