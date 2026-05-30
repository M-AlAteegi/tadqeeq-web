import type { Category, ClauseSummary } from '../lib/types'
import { visualFor } from '../lib/libCategoryVisuals'

interface Props {
  category: Category
  clauses: ClauseSummary[]
  onBack: () => void
  onView: (clauseId: string) => void
  onAsk: (clauseId: string) => void
}

export function LibraryDrill({ category, clauses, onBack, onView, onAsk }: Props) {
  const vis = visualFor(category.id)
  return (
    <div className="library-drill">
      <div className="lib-drill-header">
        <button type="button" className="lib-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Categories
        </button>
        <div className="lib-drill-titlewrap">
          <span className="lib-drill-title" style={{ color: vis.color }}>
            {category.label_en}
          </span>
        </div>
      </div>
      <div className="lib-clause-list">
        {clauses.map((c) => {
          const typeClass =
            c.type === 'contract' ? 'contract' : c.type === 'snippet' ? 'snippet' : 'clause'
          return (
            <div key={c.id} className="lib-clause-card" data-clause-id={c.id}>
              <div className="lib-clause-info">
                <div className="lib-clause-name">
                  {c.title_en}
                  <span className={`clause-type-badge ${typeClass}`}>{c.type ?? 'clause'}</span>
                </div>
                {c.tags && c.tags.length > 0 && (
                  <div className="lib-clause-tags">{c.tags.join(' · ')}</div>
                )}
              </div>
              <div className="lib-clause-actions">
                <button
                  type="button"
                  className="lib-clause-btn view-btn"
                  onClick={() => onView(c.id)}
                >
                  View
                </button>
                <button
                  type="button"
                  className="lib-clause-btn primary ask-btn"
                  onClick={() => onAsk(c.id)}
                >
                  Ask
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
