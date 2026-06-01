import { useEffect, useRef, useState } from 'react'
import type { BackendStatus } from '../hooks/useBackendHealth'
import { useToast } from './Toast'

interface Props {
  status: BackendStatus
}

// Thin banner at the top of .main when the backend is unreachable or
// still booting. Pointer-events: none so it never blocks UI underneath
// — the user can keep trying things, the network layer will just
// surface errors per-action until /health comes back.
//
// Also fires a one-shot "reconnected" toast when the status flips from
// 'disconnected' back to 'ready' / 'warming', so the user gets positive
// feedback that things are usable again.

export function BackendStatusBanner({ status }: Props) {
  const toast = useToast()
  const [visibleAt, setVisibleAt] = useState<number | null>(null)
  // Track the previous status across renders so we can detect the
  // disconnected → recovered transition without firing on every render.
  const prevStatusRef = useRef<BackendStatus>(status)

  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status
    if (prev === 'disconnected' && status !== 'disconnected') {
      toast.show('Backend reconnected')
    }
    if (status === 'disconnected' && visibleAt === null) {
      setVisibleAt(Date.now())
    } else if (status !== 'disconnected' && visibleAt !== null) {
      setVisibleAt(null)
    }
  }, [status, toast, visibleAt])

  // Only the disconnected state warrants the banner. 'warming' has its
  // own overlay on the welcome screen; 'ready' / 'connecting' need no
  // top-level chrome.
  if (status !== 'disconnected') return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="backend-status-banner"
    >
      <span className="backend-status-dot" />
      Backend disconnected — retrying. New messages won&apos;t send until reconnected.
    </div>
  )
}
