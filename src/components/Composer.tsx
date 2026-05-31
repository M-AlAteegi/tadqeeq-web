import { useRef, useState, useEffect } from 'react'

interface Props {
  onSend: (text: string) => void
  onStop?: () => void
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
  // Fired by the attach button. v3.2 semantics: hop into analysis mode
  // and pop the file picker, so attaching from chat lands you in the
  // surface that actually consumes the file.
  onAttach?: () => void
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

// Bootstrap bi-upload — same arrow-into-tray glyph the sidebar Upload
// File button uses. Lighter visual weight than the file-earmark variant,
// which the user found too chunky against the slim composer chrome.
const ICON_ATTACH = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
  </svg>
)

export function Composer({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = 'Ask about regulations...',
  onAttach,
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
          onClick={onAttach}
          disabled={!onAttach}
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
