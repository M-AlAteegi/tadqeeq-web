import type { Category, ClauseDetail } from '../lib/types'
import { visualFor } from '../lib/libCategoryVisuals'

interface Props {
  category: Category
  clause: ClauseDetail
  onBackToList: () => void
}

export function LibraryFocusedHeader({ category, clause, onBackToList }: Props) {
  const vis = visualFor(category.id)
  const clauseTitle = clause.title_en || clause.title_ar || 'clause'
  return (
    <div className="library-drill">
      <div className="lib-drill-header">
        <button type="button" className="lib-back-btn" onClick={onBackToList}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {category.label_en} clauses
        </button>
        <div className="lib-drill-titlewrap">
          <span className="lib-drill-title" style={{ color: vis.color }}>
            {category.label_en}
          </span>
          <span className="lib-focus-chev">›</span>
          <span className="lib-focus-clausename">{clauseTitle}</span>
        </div>
      </div>
    </div>
  )
}
