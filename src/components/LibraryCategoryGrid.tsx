import type { Category, ClauseSummary } from '../lib/types'
import { visualFor } from '../lib/libCategoryVisuals'

interface Props {
  categories: Category[]
  clauses: ClauseSummary[]
  onSelect: (categoryId: string) => void
}

export function LibraryCategoryGrid({ categories, clauses, onSelect }: Props) {
  return (
    <div className="library-welcome">
      <div className="lib-header">
        <h1>Clause Library</h1>
        <p>
          Curated Shariah-compliant contract templates and standalone clauses for Saudi Islamic
          finance work. Browse by instrument category, preview the full text bilingually, and drop
          a clause into the chat below to ask TadqeeqAI for analysis, adaptation, or comparison
          against your own drafts.
        </p>
      </div>
      <div className="lib-categories" id="libCategoriesGrid">
        {categories.map((cat) => {
          const vis = visualFor(cat.id)
          const count = clauses.filter((c) => c.category === cat.id).length
          return (
            <div
              key={cat.id}
              className="lib-cat-card"
              data-cat={cat.id}
              style={{ ['--cat-color' as string]: vis.color } as React.CSSProperties}
              onClick={() => onSelect(cat.id)}
            >
              <div className="lib-cat-icon">{vis.icon}</div>
              <div className="lib-cat-body">
                <div className="lib-cat-title">{cat.label_en}</div>
                {cat.description_en && (
                  <div className="lib-cat-desc">{cat.description_en}</div>
                )}
                <div className="lib-cat-meta">
                  {count} {count === 1 ? 'template' : 'templates'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
