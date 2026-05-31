import type { Source } from '../lib/types'

interface Props {
  source: Source
}

// Common English filler words that appear stuck inside a camel-cased
// doc name. Keeps the list small so we don't accidentally split proper
// nouns that happen to contain these substrings.
const FILLERS = /([a-z])(of|the|on|and|in|to|for|by|at|or|from|with)([a-z])/g

// SAMA/CMA documents land in the corpus as CamelCase strings like
// "CapitalMarketLaw" or "ImplementingRegulationoftheRealEstateFinanceLaw",
// sometimes with a "_Ar" / "_En" suffix. The user wants the source pill
// to show a clean human title (also a graceful fallback when the
// article carries no title of its own).
function prettifyDocName(raw: string): string {
  if (!raw) return ''
  let s = raw.replace(/\.(pdf|docx?|md|txt)$/i, '')
  s = s.replace(/[_\-\s]+(ar|en)$/i, '')
  // Camel-case split: insert space at lower→upper and acronym→word
  // transitions so "FinanceCompanies" → "Finance Companies".
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  // Normalize remaining separators and collapse whitespace.
  s = s.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim()
  // Many source PDFs were title-cased then concatenated, so substrings
  // like "Regulationofthe" survive the camel split as one word. Pull
  // the small filler words back out without breaking proper nouns.
  // Loop twice to catch back-to-back fillers ("ofthe" → "of the").
  for (let i = 0; i < 2; i += 1) s = s.replace(FILLERS, '$1 $2 $3')
  return s.replace(/\s+/g, ' ').trim()
}

export function SourcePill({ source }: Props) {
  // Fallback chain: explicit title → prettified doc name → bare article id.
  // The doc-name fallback addresses ~32% of SAMA/CMA articles that landed
  // in the corpus without a parseable title (it's a publication artifact,
  // not an ingestion bug — see CLAUDE.md project notes).
  const docTitle = prettifyDocName(source.document)
  const text = source.title
    ? `${source.article}: ${source.title}`
    : docTitle
      ? `${source.article}: ${docTitle}`
      : source.article
  return (
    <span className="source-tag" title={source.document}>
      {text}
    </span>
  )
}
