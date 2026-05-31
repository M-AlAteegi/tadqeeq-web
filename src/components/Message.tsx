import { useState } from 'react'
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
  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const LOGO_AVATAR_SVG = (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'white' }}>
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
)

const COPY_ICON = (
  <svg
    className="copy-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const CHECK_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

function stripMarkdown(text: string): string {
  if (!text) return ''
  let t = text
  t = t.replace(/^#+\s+/gm, '')
  t = t.replace(/\*\*/g, '').replace(/__/g, '')
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  t = t.replace(/`/g, '')
  t = t.replace(/^>\s+/gm, '')
  return t.trim()
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export function Message({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'
  const dir = detectDir(message.content)
  const isArabic = ARABIC_RE.test(message.content) && dir === 'rtl'
  const [copied, setCopied] = useState(false)

  const cls = `msg ${isUser ? 'user' : 'assistant'}${isStreaming ? ' streaming' : ''}`
  const textCls = `msg-text${isArabic ? ' msg-text-ar' : ''}`
  const textProps = dir ? { dir } : {}

  const reg = !isUser && message.regulator && message.regulator !== 'NONE' ? message.regulator : null
  const regColorVar =
    reg === 'SAMA' ? 'var(--sama)' : reg === 'CMA' ? 'var(--cma)' : 'var(--accent)'

  async function handleCopy() {
    const ok = await copyToClipboard(stripMarkdown(message.content))
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={cls}>
      {!isUser && (
        <button
          className={copied ? 'msg-copy copied' : 'msg-copy'}
          onClick={handleCopy}
          aria-label="Copy response"
          title={copied ? 'Copied' : 'Copy'}
          type="button"
        >
          {copied ? CHECK_ICON : COPY_ICON}
        </button>
      )}
      <div className="avatar">{isUser ? USER_AVATAR_SVG : LOGO_AVATAR_SVG}</div>
      <div className="msg-body" style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 6,
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text2)',
            }}
          >
            {isUser ? 'You' : 'TadqeeqAI'}
          </span>
          {reg && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: regColorVar,
                padding: '3px 10px',
                border: `1px solid ${regColorVar}`,
                borderRadius: 100,
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              {reg}
            </span>
          )}
        </div>
        <div className={textCls} {...textProps}>
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          ) : message.content ? (
            <Markdown content={message.content} />
          ) : (
            <span className="typing-indicator stream-typing">
              <span /><span /><span />
            </span>
          )}
          {/* Hold sources until streaming finishes — backend ships them in
              the `meta` event before any tokens, but reading the answer
              first is the natural flow. Rendering them mid-stream pulls
              the eye away from the text and dilutes the affordance. */}
          {!isUser && !isStreaming && message.sources && message.sources.length > 0 && (
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
