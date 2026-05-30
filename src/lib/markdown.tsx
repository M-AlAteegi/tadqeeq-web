// Thin react-markdown wrapper. Styling lives in .msg-text rules in v3.css —
// we don't override any element renderers here so the v3 typography wins.
//
// Arabic is detected at the message level (the wrapping .msg-text gets the
// .msg-text-ar class) which the v3 cascade picks up via [dir="rtl"] selectors.

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
}

export function Markdown({ content }: Props) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
}
