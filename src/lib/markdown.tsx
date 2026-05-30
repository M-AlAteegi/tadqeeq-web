// Thin wrapper around react-markdown so styling lives in one place and
// we can swap renderer libraries later without touching every component.

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
}

export function Markdown({ content }: Props) {
  return (
    <div
      className="prose-tadqeeq"
      // Arabic content is auto-detected by the browser via dir="auto" —
      // RTL paragraphs reorder without us having to detect language ourselves.
      dir="auto"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Compact spacing, accent-colored links
          a: (props) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-accent-chat)' }}
            />
          ),
          code: (props) => {
            const { children, className } = props
            // Block code (```lang) vs inline `code`
            if (className?.startsWith('language-')) {
              return (
                <pre
                  style={{
                    background: 'var(--color-app-card)',
                    border: '1px solid var(--color-app-border)',
                    borderRadius: 6,
                    padding: 12,
                    overflowX: 'auto',
                    fontSize: 13,
                  }}
                >
                  <code className={className}>{children}</code>
                </pre>
              )
            }
            return (
              <code
                style={{
                  background: 'var(--color-app-card-hover)',
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontSize: '0.9em',
                }}
              >
                {children}
              </code>
            )
          },
          table: (props) => (
            <div style={{ overflowX: 'auto', margin: '8px 0' }}>
              <table
                {...props}
                style={{
                  borderCollapse: 'collapse',
                  fontSize: 14,
                }}
              />
            </div>
          ),
          th: (props) => (
            <th
              {...props}
              style={{
                border: '1px solid var(--color-app-border)',
                padding: '6px 10px',
                textAlign: 'left',
                background: 'var(--color-app-card-hover)',
              }}
            />
          ),
          td: (props) => (
            <td
              {...props}
              style={{
                border: '1px solid var(--color-app-border)',
                padding: '6px 10px',
              }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
