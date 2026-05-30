// v3.2-faithful: .export-menu dropdown with PDF / DOCX / MD actions.
// Used by both the chat header (chat + library + brief exports) and the
// analysis doc bar (brief export today; compliance once backend lands).

import { useEffect, useRef, useState } from 'react'
import { downloadExport } from '../lib/api'

export type ExportFormat = 'pdf' | 'docx' | 'md'

interface Props {
  // Each format provides its own URL — caller knows whether it's
  // /api/chats/{id}/export/{fmt} or /api/analysis/.../brief/export/{fmt}
  // or anything else.
  urls: Record<ExportFormat, string>
  suggestedBaseName: string
  buttonLabel?: string
  primary?: boolean
  align?: 'left' | 'right'
}

const ICON_PDF = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <path d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM1.6 11.85H0v3.999h.791v-1.342h.803q.43 0 .732-.173.305-.175.463-.474a1.4 1.4 0 0 0 .161-.677q0-.375-.158-.677a1.2 1.2 0 0 0-.46-.477q-.3-.18-.732-.179m.545 1.333a.8.8 0 0 1-.085.38.57.57 0 0 1-.238.241.8.8 0 0 1-.375.082H.788V12.48h.66q.327 0 .512.181.185.183.185.522m1.217-1.333v3.999h1.46q.602 0 .998-.237a1.45 1.45 0 0 0 .595-.689q.196-.45.196-1.084 0-.63-.196-1.075a1.43 1.43 0 0 0-.589-.68q-.396-.234-1.005-.234zm.791.645h.563q.371 0 .609.152a.9.9 0 0 1 .354.454q.118.302.118.753a2.3 2.3 0 0 1-.068.592 1.1 1.1 0 0 1-.196.422.8.8 0 0 1-.334.252 1.3 1.3 0 0 1-.483.082h-.563zm3.743 1.763v1.591h-.79V11.85h2.548v.653H7.896v1.117h1.606v.638z" />
  </svg>
)

const ICON_DOCX = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <path d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM1 15.925v-3.999h1.459q.609 0 1.005.235.396.233.589.68.196.445.196 1.074 0 .634-.196 1.084-.197.451-.595.689-.396.237-.999.237zm1.354-3.354H1.79v2.707h.563q.277 0 .483-.082a.8.8 0 0 0 .334-.252q.132-.17.196-.422a2.3 2.3 0 0 0 .068-.592q0-.45-.118-.753a.9.9 0 0 0-.354-.454q-.237-.152-.61-.152Zm3.807-.645v3.999h-.79V11.926zm1.598 1.117q0-.373.103-.633a.87.87 0 0 1 .301-.398.8.8 0 0 1 .475-.138q.225 0 .398.097a.7.7 0 0 1 .273.26.85.85 0 0 1 .12.381h.765v-.073a1.33 1.33 0 0 0-.466-.964 1.4 1.4 0 0 0-.49-.272 1.8 1.8 0 0 0-.606-.097q-.534 0-.911.223-.375.222-.571.633-.197.41-.197.978v.498q0 .568.194.976.195.406.571.627.375.216.914.216.44 0 .785-.164t.551-.454a1.27 1.27 0 0 0 .226-.674v-.076h-.765a.8.8 0 0 1-.117.364.7.7 0 0 1-.273.248.9.9 0 0 1-.401.088.85.85 0 0 1-.478-.131.83.83 0 0 1-.298-.393 1.7 1.7 0 0 1-.103-.627zm5.092-1.117h.894l-1.275 2.006 1.254 1.992h-.908l-.85-1.415h-.035l-.852 1.415h-.862l1.24-2.015-1.228-1.984h.932l.832 1.439h.035z" />
  </svg>
)

const ICON_MD = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <path d="M14 4.5V14a2 2 0 0 1-2 2H9v-1h3a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM.706 13.189v2.66H0V11.85h.806l1.14 2.596h.026l1.14-2.596h.8v3.999h-.716v-2.66h-.038l-.946 2.159h-.516l-.952-2.16H.706Zm3.919 2.66V11.85h1.459q.609 0 1.005.234t.589.68q.195.445.196 1.075 0 .634-.196 1.084-.197.451-.595.689-.396.237-1 .237zm1.353-3.354h-.562v2.707h.562q.279 0 .484-.082a.8.8 0 0 0 .334-.252 1.1 1.1 0 0 0 .196-.422q.067-.252.067-.592a2.1 2.1 0 0 0-.117-.753.9.9 0 0 0-.354-.454q-.238-.152-.61-.152" />
  </svg>
)

const ICONS: Record<ExportFormat, React.ReactNode> = {
  pdf: ICON_PDF,
  docx: ICON_DOCX,
  md: ICON_MD,
}

const LABELS: Record<ExportFormat, string> = {
  pdf: 'PDF (.pdf)',
  docx: 'Word (.docx)',
  md: 'Markdown (.md)',
}

const ICON_SAVE = (
  <svg viewBox="0 0 24 24" strokeWidth={2} fill="none" stroke="currentColor">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
)

const ICON_DOWNLOAD = (
  <svg viewBox="0 0 24 24" strokeWidth={2.5} fill="none" stroke="currentColor">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
)

export function SaveReportMenu({
  urls,
  suggestedBaseName,
  buttonLabel = 'Save Report',
  primary = true,
  align = 'right',
}: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<ExportFormat | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  async function handle(fmt: ExportFormat) {
    setBusy(fmt)
    try {
      await downloadExport(urls[fmt], `${suggestedBaseName}.${fmt}`)
    } catch {
      // surface a minimal alert; full toast lands in #101
      alert(`Save failed (${fmt.toUpperCase()})`)
    } finally {
      setBusy(null)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className={primary ? 'header-btn primary' : 'header-btn'}
        onClick={() => setOpen((v) => !v)}
      >
        {primary ? ICON_SAVE : ICON_DOWNLOAD}
        {buttonLabel}
      </button>
      <div
        className={open ? 'export-menu show' : 'export-menu'}
        style={align === 'left' ? { right: 'auto', left: 0 } : undefined}
      >
        {(['pdf', 'docx', 'md'] as ExportFormat[]).map((fmt) => (
          <div
            key={fmt}
            className="export-item"
            onClick={() => handle(fmt)}
            style={busy === fmt ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
          >
            {ICONS[fmt]}
            {busy === fmt ? `Saving ${fmt.toUpperCase()}…` : LABELS[fmt]}
          </div>
        ))}
      </div>
    </div>
  )
}
