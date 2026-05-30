import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onStop?: () => void
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
  selectionRange?: { start: number; end: number } | null
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

const ICON_EXPAND = (
  <svg viewBox="0 0 24 24">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)

export function LibraryComposer({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = 'Pick a category above, then ask TadqeeqAI about a clause...',
  selectionRange,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [showExpand, setShowExpand] = useState(false)

  // Autosize the textarea. Cap depends on expanded state (160px vs 330px,
  // matching the v3 CSS rules). Also detect when content wraps to 2+ lines
  // and reveal the expand button.
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const cap = expanded ? 330 : 160
    const desired = Math.min(ta.scrollHeight, cap)
    ta.style.height = `${desired}px`
    // Tall = multiple lines wrapped. v3 uses line-height 1.45 * font 14px = ~20px;
    // anything > ~36px (one line + padding) means we have multi-line content.
    setShowExpand(ta.scrollHeight > 40)
  }, [value, expanded])

  // When parent supplies a selection range (e.g. after inserting a primer
  // with [Your question here] placeholder), focus + highlight that text so
  // the user can type their question in-place.
  useEffect(() => {
    if (!selectionRange) return
    const ta = taRef.current
    if (!ta) return
    ta.focus()
    ta.setSelectionRange(selectionRange.start, selectionRange.end)
  }, [selectionRange])

  function submit() {
    if (isStreaming) {
      onStop?.()
      return
    }
    if (!value.trim() || disabled) return
    onSend()
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const sendDisabled = !isStreaming && (!value.trim() || disabled)
  const wrapClass = [
    'lib-composer',
    expanded ? 'expanded' : '',
    showExpand ? 'show-expand' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="lib-composer-wrap" id="libraryInputArea">
      <div className={wrapClass} id="libComposer">
        <div className="lib-composer-top">
          <button
            type="button"
            className="lib-composer-expand"
            title={expanded ? 'Collapse input' : 'Expand input'}
            aria-label={expanded ? 'Collapse input' : 'Expand input'}
            onClick={() => setExpanded((v) => !v)}
          >
            {ICON_EXPAND}
          </button>
        </div>
        <div className="lib-composer-row">
          <textarea
            ref={taRef}
            className="lib-composer-input"
            id="libChatInput"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            disabled={disabled && !isStreaming}
            placeholder={placeholder}
            rows={1}
            dir="auto"
            aria-label="Ask TadqeeqAI about a clause"
          />
          <button
            type="button"
            className="lib-composer-send"
            id="libChatSend"
            disabled={sendDisabled}
            onClick={submit}
            aria-label={isStreaming ? 'Stop generation' : 'Send message'}
            title={isStreaming ? 'Stop generation' : sendDisabled ? 'Type a question first' : 'Send'}
          >
            {isStreaming ? ICON_STOP : ICON_SEND}
          </button>
        </div>
      </div>
      <div className="lib-composer-hint">
        Edit <code>[Your question here]</code> after inserting a clause, then press{' '}
        <strong>Send</strong> (or Enter).
      </div>
    </div>
  )
}
