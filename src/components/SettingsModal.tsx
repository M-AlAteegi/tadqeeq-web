// Global settings modal — currently houses just the bearer-token field
// that gates a deployed backend. Designed extensibly so theme persistence
// notes / model selection / etc. can land in additional sections later
// without redesigning the shell.
//
// Portaled to document.body so the .main panel's transform doesn't
// capture the fixed-position overlay (same trick the delete + clause
// preview modals use).

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, getApiKey, setApiKey } from '../lib/api'
import { useToast } from './Toast'

interface Props {
  open: boolean
  onClose: () => void
}

const KEY_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M0 8a4 4 0 0 1 7.465-2H14a.5.5 0 0 1 .354.146l1.5 1.5a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0L13 9.207l-.646.647a.5.5 0 0 1-.708 0L11 9.207l-.646.647a.5.5 0 0 1-.708 0L9 9.207l-.646.647A.5.5 0 0 1 8 10h-.535A4 4 0 0 1 0 8m4-3a3 3 0 1 0 2.712 4.285A.5.5 0 0 1 7.163 9h.63l.853-.854a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.793-.793-1-1h-6.63a.5.5 0 0 1-.451-.285A3 3 0 0 0 4 5" />
    <path d="M4 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
  </svg>
)

const EYE_OPEN = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
  </svg>
)

const EYE_CLOSED = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486zm-4.242-1.587a3 3 0 0 0 .98-3.422l-.78-.78a3 3 0 0 0-3.422.98zm-1.585-1.585 1.586-1.586a2 2 0 1 1-1.586 1.586z" />
    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
    <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.708zm10.296 8.884-13-13 .708-.708 13 13z" />
  </svg>
)

export function SettingsModal({ open, onClose }: Props) {
  // Buffered draft — the stored value only updates on Save. Lets the
  // user back out by closing the modal without persisting a typo.
  const [draft, setDraft] = useState('')
  const [reveal, setReveal] = useState(false)
  const [testing, setTesting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  // Re-seed draft from storage every time the modal opens. Without this
  // a Cancel-then-reopen would show whatever was last typed.
  useEffect(() => {
    if (open) {
      setDraft(getApiKey())
      setReveal(false)
      // Focus on next tick so the input is mounted.
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
  }, [open])

  // ESC closes.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function save() {
    setApiKey(draft.trim())
    toast.show(draft.trim() ? 'API key saved' : 'API key cleared')
    onClose()
  }

  function clear() {
    setDraft('')
    setApiKey('')
    toast.show('API key cleared')
  }

  async function testConnection() {
    // Save the draft FIRST so the test runs with the key the user is
    // actually proposing — otherwise we'd be testing the previously
    // saved key and the user wouldn't get useful feedback.
    const prev = getApiKey()
    setApiKey(draft.trim())
    setTesting(true)
    try {
      // getSettings is an authenticated endpoint, so 401 surfaces a
      // bad/missing key directly. 200 means either the key is valid
      // OR the backend has no API_KEY configured (also fine to send).
      await api.getSettings()
      toast.show('Connection OK')
    } catch (e) {
      const status = (e as { status?: number })?.status
      if (status === 401 || status === 403) {
        toast.show('Auth rejected — check the key', 'info')
      } else {
        toast.show(`Connection failed${status ? ` (${status})` : ''}`, 'info')
      }
      // Roll the stored key back so a failed test doesn't quietly
      // overwrite a previously-working key. Save still has to be
      // explicit to commit.
      setApiKey(prev)
    } finally {
      setTesting(false)
    }
  }

  return createPortal(
    <div
      className="modal-overlay show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={(e) => {
        // Backdrop click closes. Clicks inside the .modal card stop
        // propagation below so they don't trip this.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        style={{ width: 520, maxWidth: 'calc(100vw - 48px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title" id="settings-modal-title">Settings</div>

        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text2)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 10,
            }}
          >
            {KEY_ICON}
            <span>Backend Access Key</span>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type={reveal ? 'text' : 'password'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste the backend's access key"
              autoComplete="off"
              spellCheck={false}
              aria-label="Backend access key"
              style={{
                width: '100%',
                padding: '11px 44px 11px 14px',
                fontSize: 13,
                fontFamily: 'monospace',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? 'Hide key' : 'Show key'}
              title={reveal ? 'Hide' : 'Show'}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 28,
                height: 28,
                border: 'none',
                background: 'transparent',
                color: 'var(--text2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: 6,
              }}
            >
              {reveal ? EYE_CLOSED : EYE_OPEN}
            </button>
          </div>

          <p
            style={{
              fontSize: 12,
              color: 'var(--text3)',
              lineHeight: 1.5,
              marginTop: 10,
              marginBottom: 0,
            }}
          >
            The shared secret your backend was started with under the{' '}
            <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>
              API_KEY
            </code>{' '}
            environment variable — used to gate the backend from random
            visitors (typical for a public deploy). Leave empty for local
            development where the backend runs unauthenticated. Stored in
            this browser&apos;s localStorage and sent only as a Bearer token
            to your backend.
            <br />
            <strong style={{ color: 'var(--text2)' }}>Not</strong> your Anthropic /
            Claude key — that one lives in the backend&apos;s{' '}
            <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>
              CLAUDE_API_KEY
            </code>{' '}
            env var and never touches the browser.
          </p>
        </div>

        <div className="modal-buttons">
          <button
            type="button"
            className="modal-btn cancel"
            onClick={testConnection}
            disabled={testing}
            style={{ marginRight: 'auto' }}
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          <button type="button" className="modal-btn cancel" onClick={clear}>
            Clear
          </button>
          <button type="button" className="modal-btn delete" onClick={save} style={{ background: 'var(--accent)' }}>
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
