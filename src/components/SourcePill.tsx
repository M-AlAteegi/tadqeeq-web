import type { Source } from '../lib/types'

interface Props {
  source: Source
}

export function SourcePill({ source }: Props) {
  const text = source.title
    ? `${source.article}: ${source.title}`
    : source.article
  return (
    <span
      title={source.document}
      className="inline-block text-xs px-2 py-1 mr-1.5 mb-1.5 rounded-md"
      style={{
        background: 'var(--color-app-card-hover)',
        color: 'var(--color-app-text-dim)',
        border: '1px solid var(--color-app-border)',
      }}
    >
      {text}
    </span>
  )
}
