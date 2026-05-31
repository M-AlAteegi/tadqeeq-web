// v3.2-faithful scroll-to-bottom button. Anchored absolutely to .main
// (which has position: relative + transform: translateZ(0) — so position
// fixed wouldn't sit where we want it). The button targets a scrollable
// container by id and watches its scroll position; appears when the user
// has scrolled up far enough that "the latest content is offscreen".

import { useEffect, useState } from 'react'

interface Props {
  // Id of the scrollable container — #chat (chat + analysis modes) or
  // #libraryContent (library mode). Looked up via getElementById so we
  // don't have to thread refs through deeply-nested view trees.
  targetId: string
  // Px distance from bottom past which we consider the user "scrolled
  // away from the latest content". Matches the 120px threshold the
  // library composer already uses for streaming auto-scroll logic.
  threshold?: number
}

const ICON_DOWN = (
  <svg viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export function ScrollToBottomButton({ targetId, threshold = 120 }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = document.getElementById(targetId)
    if (!el) return
    function check() {
      // Re-read every check — element identity is stable (id-based) but
      // its scroll metrics change as content streams in.
      const distance = el!.scrollHeight - el!.scrollTop - el!.clientHeight
      setVisible(distance > threshold)
    }
    el.addEventListener('scroll', check, { passive: true })
    // Initial check + observe size changes (e.g. streaming tokens push
    // scrollHeight past the threshold even though scrollTop didn't move).
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    // Also tick on child mutations — streaming inserts text nodes that
    // don't always trigger ResizeObserver.
    const mo = new MutationObserver(check)
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
      mo.disconnect()
    }
  }, [targetId, threshold])

  function handleClick() {
    const el = document.getElementById(targetId)
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      className={visible ? 'scroll-to-bottom-btn visible' : 'scroll-to-bottom-btn'}
      onClick={handleClick}
      aria-label="Scroll to latest message"
      title="Scroll to latest"
    >
      {ICON_DOWN}
    </button>
  )
}
