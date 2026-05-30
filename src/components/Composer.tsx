import { useRef, useState, useEffect } from 'react'

interface Props {
  onSend: (text: string) => void
  onStop?: () => void
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
}

const ICON_SEND = (
  <svg viewBox="0 0 24 24">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
)

const ICON_STOP = (
  <svg viewBox="0 0 24 24">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

const ICON_ATTACH = (
  <svg viewBox="0 0 24 24">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
)

export function Composer({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = 'Ask about regulations...',
}: Props) {
  const [text, setText] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const desired = ta.scrollHeight
    ta.style.height = `${Math.min(desired, 120)}px`
    // Global `* { box-sizing: border-box }` in v3.css makes scrollHeight
    // and the height we set drift apart by the padding amount, which trips
    // the default overflow-y:auto scrollbar even on empty content. Pin
    // overflow-y to hidden unless we've actually hit the max-height cap.
    ta.style.overflowY = desired > 120 ? 'auto' : 'hidden'
  }, [text])

  function submit() {
    if (isStreaming) {
      onStop?.()
      return
    }
    const v = text.trim()
    if (!v || disabled) return
    onSend(v)
    setText('')
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const sendDisabled = !isStreaming && (!text.trim() || disabled)

  return (
    <div className="input-area">
      <div id="chatInputBox" className="input-box">
        <button
          className="attach-btn"
          type="button"
          title="Attach Document"
          aria-label="Attach document for analysis"
        >
          {ICON_ATTACH}
        </button>
        <textarea
          ref={taRef}
          id="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled && !isStreaming}
          placeholder={placeholder}
          rows={1}
          dir="auto"
          aria-label="Type your compliance question here"
          aria-multiline="true"
        />
        <button
          className={isStreaming ? 'send stop' : 'send'}
          id="send"
          type="button"
          disabled={sendDisabled}
          onClick={submit}
          aria-label={isStreaming ? 'Stop generation' : 'Send message'}
          title={isStreaming ? 'Stop generation' : 'Send'}
        >
          {isStreaming ? ICON_STOP : ICON_SEND}
        </button>
      </div>
      <div style={{
        textAlign: 'center',
        marginTop: '12px',
        fontSize: '10px',
        color: 'var(--text3)',
        fontWeight: 600,
      }}>
        AI can make mistakes. Verify important information.
      </div>
    </div>
  )
}
