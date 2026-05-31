import type { Source } from '../lib/types'

interface Props {
  source: Source
}

// Narrow, curated list of English filler-word groups observed stuck
// inside corpus doc names like "ImplementingRegulationoftheRealEstate…".
// Replacing the stuck substrings with CamelCased versions BEFORE the
// camel-split pass means only these specific patterns split — proper
// words like "Implementing" / "Regulations" stay intact, which the
// previous lookaround-based regex was breaking ("Implement in g").
const STUCK_PAIRS: Array<[RegExp, string]> = [
  [/(?<=[a-z])ofthe(?=[A-Z])/g, 'OfThe'],
  [/(?<=[a-z])andthe(?=[A-Z])/g, 'AndThe'],
  [/(?<=[a-z])inthe(?=[A-Z])/g, 'InThe'],
  [/(?<=[a-z])tothe(?=[A-Z])/g, 'ToThe'],
  [/(?<=[a-z])forthe(?=[A-Z])/g, 'ForThe'],
  [/(?<=[a-z])onthe(?=[A-Z])/g, 'OnThe'],
]

// SAMA/CMA documents land in the corpus as CamelCase strings like
// "CapitalMarketLaw" or "ImplementingRegulationoftheRealEstateFinanceLaw",
// sometimes with a "_Ar" / "_En" suffix. The user wants the source pill
// to show a clean human title (also a graceful fallback when the
// article carries no title of its own).
function prettifyDocName(raw: string): string {
  if (!raw) return ''
  let s = raw.replace(/\.(pdf|docx?|md|txt)$/i, '')
  s = s.replace(/[_\-\s]+(ar|en)$/i, '')
  // Repair known stuck filler clusters BEFORE camel split so the
  // following pass treats them as proper word boundaries.
  for (const [pat, repl] of STUCK_PAIRS) s = s.replace(pat, repl)
  // Camel-case split — insert space at lower→upper and acronym→word
  // transitions so "FinanceCompanies" → "Finance Companies".
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  s = s.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return s
}

export function SourcePill({ source }: Props) {
  // The corpus stores titled articles with their title baked INTO the
  // article field, separated by ":" (e.g. "Article 113: Publication and
  // Entry into Force"). The `title` field is empty for those, so
  // detecting the embedded ":" is the load-bearing signal for "this
  // already has a title — don't append a doc-name fallback".
  //
  // Untitled articles arrive as bare strings ("Article 22"); for those
  // the prettified doc name is the friendliest fallback we can offer
  // without re-ingesting the source PDFs (see project_article_title_coverage
  // memory + CLAUDE.md notes — ~32% of articles are bare by source).
  const article = source.article || ''
  const hasInlineTitle = article.includes(':')
  const docTitle = prettifyDocName(source.document)
  let text: string
  if (hasInlineTitle) {
    text = article
  } else if (source.title) {
    text = `${article}: ${source.title}`
  } else if (docTitle) {
    text = `${article}: ${docTitle}`
  } else {
    text = article
  }
  return (
    <span className="source-tag" title={source.document}>
      {text}
    </span>
  )
}
