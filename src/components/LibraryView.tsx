import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { streamPOST } from '../lib/sse'
import type {
  ChatMessage,
  ClauseDetail,
  ClauseSummary,
  LibraryIndex,
  Source,
} from '../lib/types'
import { LibraryCategoryGrid } from './LibraryCategoryGrid'
import { LibraryDrill } from './LibraryDrill'
import { LibraryComposer } from './LibraryComposer'
import { ClausePreviewModal } from './ClausePreviewModal'
import { Message } from './Message'

type View = 'welcome' | 'drill' | 'focused'

interface Props {
  chatId: string | null
  onChatCreated: (id: string) => void
  onChatTouched: () => void
}

export function LibraryView({ chatId, onChatCreated, onChatTouched }: Props) {
  const [index, setIndex] = useState<LibraryIndex | null>(null)
  const [view, setView] = useState<View>('welcome')
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null)
  const [focusedClause, setFocusedClause] = useState<ClauseDetail | null>(null)
  const [previewClause, setPreviewClause] = useState<ClauseDetail | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [composerText, setComposerText] = useState('')
  const [composerSelection, setComposerSelection] = useState<{ start: number; end: number } | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // One-shot library index load.
  useEffect(() => {
    let cancelled = false
    api
      .libraryIndex()
      .then((i) => {
        if (!cancelled) setIndex(i)
      })
      .catch(() => {
        if (!cancelled) setIndex({ categories: [], clauses: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Load a chat the user picked from the sidebar.
  useEffect(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
    setStreamingIndex(null)
    if (!chatId) {
      setMessages([])
      setView('welcome')
      setCurrentCategoryId(null)
      setFocusedClause(null)
      setComposerText('')
      return
    }
    let cancelled = false
    api
      .getLibraryChat(chatId)
      .then((c) => {
        if (cancelled) return
        setMessages(c.messages ?? [])
        // Reopen in the category the chat is bound to (if known).
        if (c.category_id) {
          setCurrentCategoryId(c.category_id)
          setView('drill')
        } else {
          setView('welcome')
        }
      })
      .catch(() => {
        if (!cancelled) setMessages([])
      })
    return () => {
      cancelled = true
    }
  }, [chatId])

  // Auto-scroll the library content area to bottom when new messages land,
  // unless the user has scrolled up.
  const userScrolledUpRef = useRef(false)
  useEffect(() => {
    if (userScrolledUpRef.current) return
    const el = contentRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, streamingIndex])

  const currentCategory =
    currentCategoryId && index
      ? index.categories.find((c) => c.id === currentCategoryId) ?? null
      : null

  const clausesInCategory: ClauseSummary[] = currentCategoryId && index
    ? index.clauses.filter((c) => c.category === currentCategoryId)
    : []

  const handleCategorySelect = useCallback(
    (catId: string) => {
      setCurrentCategoryId(catId)
      setFocusedClause(null)
      setMessages([])
      setComposerText('')
      setView('drill')
    },
    [],
  )

  const handleBack = useCallback(() => {
    setCurrentCategoryId(null)
    setFocusedClause(null)
    setMessages([])
    setComposerText('')
    setView('welcome')
  }, [])

  const handleView = useCallback(async (clauseId: string) => {
    try {
      const c = await api.clause(clauseId)
      setPreviewClause(c)
      setPreviewOpen(true)
    } catch {
      /* silent */
    }
  }, [])

  const insertClauseAsPrimer = useCallback((c: ClauseDetail) => {
    const body = c.body_en || c.body_ar || ''
    const title = c.title_en || c.title_ar || 'clause'
    const primer = `I'm reviewing the following ${title}. Please help me adapt or assess it:\n\n${body}\n\n[Your question here]`
    setComposerText(primer)
    const placeholder = '[Your question here]'
    const idx = primer.lastIndexOf(placeholder)
    if (idx >= 0) {
      setComposerSelection({ start: idx, end: idx + placeholder.length })
    }
    setFocusedClause(c)
    setView('focused')
  }, [])

  const handleAsk = useCallback(
    async (clauseId: string) => {
      try {
        const c = await api.clause(clauseId)
        insertClauseAsPrimer(c)
      } catch {
        /* silent */
      }
    },
    [insertClauseAsPrimer],
  )

  async function handleSend() {
    const text = composerText.trim()
    if (!text) return

    let activeId = chatId
    if (!activeId) {
      try {
        const created = await api.newLibraryChat(currentCategoryId ?? null)
        activeId = created.id
        onChatCreated(activeId)
      } catch {
        return
      }
    }

    const userMsg: ChatMessage = { role: 'user', content: text }
    const assistantPlaceholder: ChatMessage = { role: 'assistant', content: '' }

    setMessages((prev) => {
      const next = [...prev, userMsg, assistantPlaceholder]
      setStreamingIndex(next.length - 1)
      return next
    })
    setIsStreaming(true)
    setComposerText('')

    const ctrl = new AbortController()
    abortRef.current = ctrl
    let acc = ''
    let lastSources: Source[] = []
    let lastRegulator: string | null = null

    try {
      for await (const event of streamPOST(
        '/api/library/query/stream',
        {
          question: text,
          chat_id: activeId,
          category_id: currentCategoryId ?? null,
        },
        { signal: ctrl.signal },
      )) {
        if (event.type === 'meta') {
          lastSources = (event.sources as Source[]) ?? []
          lastRegulator = (event.regulator as string) ?? null
          setMessages((prev) => {
            const copy = [...prev]
            const last = copy[copy.length - 1]
            copy[copy.length - 1] = {
              ...last,
              sources: lastSources,
              regulator: lastRegulator,
            }
            return copy
          })
        } else if (event.type === 'token') {
          acc += String(event.text ?? '')
          setMessages((prev) => {
            const copy = [...prev]
            copy[copy.length - 1] = { ...copy[copy.length - 1], content: acc }
            return copy
          })
        } else if (event.type === 'error') {
          throw new Error(String(event.message ?? 'stream error'))
        }
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        const msg = String(err)
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          copy[copy.length - 1] = {
            ...last,
            content: (last.content || '') + `\n\n_Error: ${msg}_`,
          }
          return copy
        })
      }
    } finally {
      setIsStreaming(false)
      setStreamingIndex(null)
      abortRef.current = null
      onChatTouched()
    }
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledUpRef.current = distanceFromBottom > 120
  }

  // The composer is visible in drill + focused, hidden on welcome (matches v3).
  const composerVisible = view !== 'welcome'

  const composerPlaceholder =
    view === 'focused' && focusedClause
      ? `Edit your question about "${focusedClause.title_en}" and press Send…`
      : currentCategory
        ? `Ask TadqeeqAI about ${currentCategory.label_en} clauses — click Ask on any template to insert it...`
        : 'Pick a category above, then ask TadqeeqAI about a clause...'

  return (
    <div className="library-main" id="libraryMain">
      <div id="libraryContent" ref={contentRef} onScroll={handleScroll}>
        {view === 'welcome' && index && (
          <LibraryCategoryGrid
            categories={index.categories}
            clauses={index.clauses}
            onSelect={handleCategorySelect}
          />
        )}
        {view !== 'welcome' && currentCategory && (
          <LibraryDrill
            category={currentCategory}
            clauses={clausesInCategory}
            onBack={handleBack}
            onView={handleView}
            onAsk={handleAsk}
          />
        )}
        {view === 'focused' && focusedClause && (
          <div
            id="libFocusBreadcrumb"
            style={{
              maxWidth: 900,
              margin: '0 auto',
              padding: '0 32px 16px',
              fontSize: 13,
              color: 'var(--text3)',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span className="lib-focus-chev">›</span>
            <span className="lib-focus-clausename">
              {focusedClause.title_en}
              <span
                className={`clause-type-badge ${focusedClause.type ?? 'clause'}`}
                style={{ marginLeft: 10 }}
              >
                {focusedClause.type ?? 'clause'}
              </span>
            </span>
          </div>
        )}
        {messages.length > 0 && (
          <div id="libMessages" style={{ maxWidth: 880, margin: '0 auto', padding: '0 32px 24px' }}>
            {messages.map((m, i) => (
              <Message key={i} message={m} isStreaming={i === streamingIndex} />
            ))}
          </div>
        )}
      </div>
      {composerVisible && (
        <LibraryComposer
          value={composerText}
          onChange={setComposerText}
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
          placeholder={composerPlaceholder}
          selectionRange={composerSelection}
        />
      )}
      <ClausePreviewModal
        clause={previewClause}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onInsert={insertClauseAsPrimer}
      />
    </div>
  )
}
