import type { Mode } from '../lib/types'

interface Props {
  mode: Mode
}

const COPY: Record<Mode, { title: string; subtitle: string; accent: string }> = {
  chat: {
    title: 'Ask about SAMA & CMA regulations',
    subtitle:
      'Bilingual (English / Arabic) Q&A grounded in 1,350 articles from Saudi financial regulations. Hybrid BM25 + semantic retrieval, sources cited per answer.',
    accent: 'var(--color-accent-chat)',
  },
  library: {
    title: 'Curated Islamic-finance clause library',
    subtitle:
      'Browse murabaha, ijara, wakala, mudaraba, sukuk, and common clauses. Prime the assistant with a clause for compliance review or adaptation.',
    accent: 'var(--color-accent-library)',
  },
  analysis: {
    title: 'Upload a document for review',
    subtitle:
      'PDF or DOCX (up to 50 pages). Runs a 6-point compliance audit and generates an executive brief grounded in the document.',
    accent: 'var(--color-accent-analysis)',
  },
}

export function WelcomeView({ mode }: Props) {
  const { title, subtitle, accent } = COPY[mode]
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div
          className="inline-block w-16 h-1 rounded-full mb-6"
          style={{ background: accent }}
        />
        <h2 className="text-3xl font-semibold mb-3" style={{ color: 'var(--color-app-text)' }}>
          {title}
        </h2>
        <p className="text-base leading-relaxed" style={{ color: 'var(--color-app-text-dim)' }}>
          {subtitle}
        </p>
        <div className="mt-8 text-xs" style={{ color: 'var(--color-app-text-dim)' }}>
          UI under construction — chat composer + streaming wired in the next commit.
        </div>
      </div>
    </div>
  )
}
