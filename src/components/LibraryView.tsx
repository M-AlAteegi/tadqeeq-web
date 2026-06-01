import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, api, humanizeError } from '../lib/api'
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
import { LibraryFocusedHeader } from './LibraryFocusedHeader'
import { LibraryComposer } from './LibraryComposer'
import { ClausePreviewModal } from './ClausePreviewModal'
import { Message } from './Message'
import { useToast } from './Toast'
import { ScrollToBottomButton } from './ScrollToBottomButton'

type View = 'welcome' | 'drill' | 'focused'

// Parse the canonical "I'm reviewing the following <title>. Please help me
// adapt or assess it:" / Arabic "أراجع البند التالي: <title>. ساعدني" header
// the composer writes after Insert/Ask. If it matches a known clause from
// the library index, returns its id so LibraryView can restore the FOCUSED
// view when the chat is reopened from the sidebar.
function matchPrimer(text: string, libraryIndex: LibraryIndex | null): { clauseId: string } | null {
  if (!text || !libraryIndex) return null
  const enRe = /^I'm reviewing the following (.+?)\. Please help me adapt or assess it:/
  const arRe = /^أراجع البند التالي:\s*(.+?)\.\s*ساعدني/
  const enMatch = text.match(enRe)
  const arMatch = text.match(arRe)
  const title = (enMatch?.[1] ?? arMatch?.[1] ?? '').trim()
  if (!title) return null
  const lower = title.toLowerCase()
  const summary = libraryIndex.clauses.find(
    (c) =>
      (c.title_en && c.title_en.trim().toLowerCase() === lower) ||
      (c.title_ar && c.title_ar.trim() === title),
  )
  return summary ? { clauseId: summary.id } : null
}

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
  // Same fresh-send race as ChatView: handleSend → api.newLibraryChat →
  // onChatCreated → chatId prop change → useEffect would abort the just-
  // started stream and re-fetch the (empty) new chat, wiping the optimistic
  // user + assistant bubbles. skipLoadRef holds chats we created ourselves.
  const skipLoadRef = useRef<string | null>(null)
  const toast = useToast()

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

  // Load a chat the user picked from the sidebar. If the first user message
  // matches the primer pattern ('I'm reviewing the following X. Please help
  // me adapt...'), restore the FOCUSED view bound to that clause — so the
  // sidebar history takes you back where you left off, not just to the
  // category's clause list.
  useEffect(() => {
    if (chatId && skipLoadRef.current === chatId) {
      skipLoadRef.current = null
      return
    }
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
      .then(async (c) => {
        if (cancelled) return
        setMessages(c.messages ?? [])

        const firstUser = (c.messages ?? []).find((m) => m.role === 'user')
        const primerMatch = firstUser ? matchPrimer(firstUser.content, index) : null

        if (primerMatch) {
          try {
            const clause = await api.clause(primerMatch.clauseId)
            if (cancelled) return
            setFocusedClause(clause)
            setCurrentCategoryId(clause.category)
            setView('focused')
            return
          } catch {
            /* fall through to category view */
          }
        }

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
  }, [chatId, index])

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

  const insertClauseAsPrimer = useCallback((c: ClauseDetail, lang: 'en' | 'ar' = 'en') => {
    // Lang comes from the ClausePreviewModal's EN/AR toggle when invoked
    // via the modal's "Insert to Chat" button. The drill view's "Ask"
    // button doesn't pass a lang — defaults to EN, matching v3.2.
    const useAr = lang === 'ar' && !!c.body_ar
    const body = useAr ? c.body_ar! : (c.body_en || c.body_ar || '')
    const title = useAr ? (c.title_ar || c.title_en || 'clause') : (c.title_en || c.title_ar || 'clause')
    const primer = useAr
      ? `أراجع البند التالي: ${title}. ساعدني في تعديله أو تقييمه:\n\n${body}\n\n[ضع سؤالك هنا]`
      : `I'm reviewing the following ${title}. Please help me adapt or assess it:\n\n${body}\n\n[Your question here]`
    setComposerText(primer)
    const placeholder = useAr ? '[ضع سؤالك هنا]' : '[Your question here]'
    const idx = primer.lastIndexOf(placeholder)
    if (idx >= 0) {
      setComposerSelection({ start: idx, end: idx + placeholder.length })
    }
    setFocusedClause(c)
    setView('focused')
    // Drop the category, so when the focused view dispatches a query it
    // creates a fresh library chat for this specific clause instead of
    // appending to whatever drill-mode chat was active.
    setMessages([])
  }, [])

  // v3-style: from focused → list returns to the clause-list view for the
  // SAME category (not to welcome). Wipes the primer + messages so the
  // next clause pick starts clean.
  const handleBackToList = useCallback(() => {
    setFocusedClause(null)
    setComposerText('')
    setComposerSelection(null)
    setMessages([])
    setView('drill')
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

  // textOverride is set on retry so the prompt comes from the failed
  // bubble's user pair instead of the (possibly empty) composer.
  async function handleSend(textOverride?: string) {
    const text = (textOverride ?? composerText).trim()
    if (!text) return

    // v3.2 rule: if the user inserted a clause primer but didn't fill in
    // [Your question here], block send — they haven't actually written a
    // question yet, just dropped boilerplate. Same logic for the AR
    // [ضع سؤالك هنا] placeholder.
    if (text.includes('[Your question here]') || text.includes('[ضع سؤالك هنا]')) {
      toast.show('Replace the question placeholder with your actual question first', 'info')
      return
    }

    let activeId = chatId
    if (!activeId) {
      try {
        const created = await api.newLibraryChat(currentCategoryId ?? null)
        activeId = created.id
        // Mark this id as "ours" BEFORE notifying the parent — when the
        // prop change comes back through useEffect, we skip the abort+load.
        skipLoadRef.current = activeId
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
    // Only clear the composer when the send was driven by the composer
    // itself — a retry shouldn't wipe whatever the user is currently
    // typing into the next message.
    if (textOverride === undefined) setComposerText('')

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
        const friendly = humanizeError(err)
        if (err instanceof ApiError && err.status === 429) {
          toast.show(friendly, 'info')
        }
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          copy[copy.length - 1] = { ...last, error: friendly }
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

  // Retry the prompt that produced a failed assistant message. Mirrors
  // ChatView's handler — slice off the failed user/assistant pair, then
  // re-issue the original text via handleSend's override parameter.
  function handleRetry(assistantIndex: number) {
    if (isStreaming) return
    const userIdx = assistantIndex - 1
    const userMsg = messages[userIdx]
    if (!userMsg || userMsg.role !== 'user') return
    const prompt = userMsg.content
    setMessages((prev) => prev.slice(0, userIdx))
    handleSend(prompt)
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledUpRef.current = distanceFromBottom > 120
  }

  // The composer is visible in drill + focused, hidden on welcome (matches v3).
  const composerVisible = view !== 'welcome'

  const composerPlaceholder =
    view === 'focused' && currentCategory
      ? `Ask TadqeeqAI about this ${currentCategory.label_en} clause...`
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
        {view === 'drill' && currentCategory && (
          <LibraryDrill
            category={currentCategory}
            clauses={clausesInCategory}
            onBack={handleBack}
            onView={handleView}
            onAsk={handleAsk}
          />
        )}
        {view === 'focused' && currentCategory && focusedClause && (
          <LibraryFocusedHeader
            category={currentCategory}
            clause={focusedClause}
            onBackToList={handleBackToList}
          />
        )}
        {messages.length > 0 && (
          <div id="libMessages" style={{ maxWidth: 880, margin: '0 auto', padding: '0 32px 24px' }}>
            {messages.map((m, i) => (
              <Message
                key={i}
                message={m}
                isStreaming={i === streamingIndex}
                onRetry={m.error ? () => handleRetry(i) : undefined}
              />
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
      <ScrollToBottomButton targetId="libraryContent" />
    </div>
  )
}
