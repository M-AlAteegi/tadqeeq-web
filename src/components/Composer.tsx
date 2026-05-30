import { useRef, useState, useEffect } from 'react'

interface Props {
  onSend: (text: string) => void
  onStop?: () => void
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
}

export function Composer({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = 'Ask about SAMA or CMA regulations…',
}: Props) {
  const [text, setText] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea up to ~6 lines, then it scrolls.
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`
  }, [text])

  function submit() {
    const v = text.trim()
    if (!v || isStreaming || disabled) return
    onSend(v)
    setText('')
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div
      className="border-t"
      style={{ borderColor: 'var(--color-app-border)' }}
    >
      <div className="max-w-3xl mx-auto px-6 py-4">
        <div
          className="flex items-end gap-2 p-2 rounded-xl"
          style={{
            background: 'var(--color-app-card)',
            border: '1px solid var(--color-app-border)',
          }}
        >
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            disabled={disabled || isStreaming}
            placeholder={placeholder}
            rows={1}
            dir="auto"
            className="flex-1 bg-transparent resize-none px-2 py-1.5 text-sm focus:outline-none disabled:opacity-50"
            style={{ color: 'var(--color-app-text)', lineHeight: '1.4' }}
          />
          {isStreaming ? (
            <button
              onClick={onStop}
              className="px-3 py-1.5 text-sm rounded-md font-medium cursor-pointer"
              style={{
                background: 'var(--color-app-card-hover)',
                color: 'var(--color-app-text)',
              }}
              aria-label="Stop generation"
              title="Stop"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!text.trim() || disabled}
              className="px-3 py-1.5 text-sm rounded-md font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: 'var(--color-accent-chat)',
                color: '#0a0e14',
              }}
              aria-label="Send message"
            >
              Send
            </button>
          )}
        </div>
        <div
          className="text-xs mt-1.5 px-2"
          style={{ color: 'var(--color-app-text-dim)' }}
        >
          Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  )
}
