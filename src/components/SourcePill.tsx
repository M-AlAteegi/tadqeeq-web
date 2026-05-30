import type { Source } from '../lib/types'

interface Props {
  source: Source
}

export function SourcePill({ source }: Props) {
  const text = source.title ? `${source.article}: ${source.title}` : source.article
  return (
    <span className="source-tag" title={source.document}>
      {text}
    </span>
  )
}
