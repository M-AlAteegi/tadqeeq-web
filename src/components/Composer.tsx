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

// Bootstrap "file-earmark-arrow-up" — file shape with an arrow up.
// Reads as "upload a document" more concretely than the bare arrow
// (which was too chunky against the slim composer / doc-bar chrome).
// Unified with the analysis empty bar and the doc-bar swap button.
const ICON_ATTACH = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.5 11.5a.5.5 0 0 1-1 0V7.707L6.354 8.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 7.707z" />
    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
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
  const [multiline, setMultiline] = useState(false)
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
    // Single-line scrollHeight sits at ~36-40px (line-height 1.45 * 14 +
    // padding). Crossing ~46-48 means the content wrapped to a 2nd line —
    // flip to multiline so .input-box.multiline can switch alignment from
    // center → flex-end (send button drops to bottom-right, Gemini-style).
    setMultiline(desired > 46)
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
      <div id="chatInputBox" className={multiline ? 'input-box multiline' : 'input-box'}>
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
        userSelect: 'none',
      }}>
        AI can make mistakes. Verify important information.
      </div>
    </div>
  )
}
