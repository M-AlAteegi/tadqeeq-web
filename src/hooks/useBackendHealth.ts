import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { CorpusStats } from '../lib/types'

// 'connecting' = no response received yet at all (first launch).
// 'warming'    = response OK but corpus stats still zero (backend boots
//                in ~10-20s because ChromaDB + sentence-transformers
//                init lazily on first /health request).
// 'ready'      = response OK + corpus loaded (stats.total > 0).
// 'disconnected' = N consecutive failures — show the persistent banner.
export type BackendStatus = 'connecting' | 'warming' | 'ready' | 'disconnected'

export interface BackendHealth {
  status: BackendStatus
  stats?: CorpusStats
  // Counts since last status flip — useful for tuning the disconnect
  // threshold in tests / probes without exposing it through state.
  consecutiveFailures: number
}

// Tunables. Kept module-level so they're easy to bump.
const POLL_MS_READY = 30_000           // healthy → check every 30s
const POLL_MS_WARMING = 1_500          // boot phase → tight loop until ready
const POLL_MS_DISCONNECTED = 5_000     // failing → retry every 5s
const FAIL_THRESHOLD_TO_DISCONNECT = 2 // 2 strikes before we call it offline

export function useBackendHealth(): BackendHealth {
  const [state, setState] = useState<BackendHealth>({
    status: 'connecting',
    consecutiveFailures: 0,
  })
  // Mirror state in a ref so the recursive scheduler reads the latest
  // status without re-binding on every tick. Sync in an effect (not
  // during render) so concurrent React doesn't see the write before
  // the matching commit.
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    let cancelled = false
    let timer: number | null = null

    function delayFor(status: BackendStatus): number {
      if (status === 'ready') return POLL_MS_READY
      if (status === 'disconnected') return POLL_MS_DISCONNECTED
      return POLL_MS_WARMING
    }

    async function tick() {
      if (cancelled) return
      try {
        const h = await api.health()
        if (cancelled) return
        const total = h.stats?.total ?? 0
        const nextStatus: BackendStatus = total > 0 ? 'ready' : 'warming'
        setState({ status: nextStatus, stats: h.stats, consecutiveFailures: 0 })
      } catch {
        if (cancelled) return
        setState((prev) => {
          const failures = prev.consecutiveFailures + 1
          const nextStatus: BackendStatus =
            failures >= FAIL_THRESHOLD_TO_DISCONNECT ? 'disconnected' : prev.status
          return { status: nextStatus, stats: prev.stats, consecutiveFailures: failures }
        })
      }
      if (cancelled) return
      timer = window.setTimeout(tick, delayFor(stateRef.current.status))
    }

    tick()
    return () => {
      cancelled = true
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [])

  return state
}
