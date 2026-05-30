# tadqeeq-web

Web frontend for **TadqeeqAI v4** — bilingual (EN/AR) Islamic-finance RAG
assistant for Saudi SAMA + CMA compliance.

React + Vite + TypeScript + Tailwind v4 single-page app that talks to
[tadqeeq-backend](https://github.com/M-AlAteegi/tadqeeq-backend) over HTTP + SSE.

## Quickstart

Requires Node 20+ and a running `tadqeeq-backend` on port 8765 (the Vite
dev server proxies `/api` and `/health` to it).

```powershell
npm install
npm run dev
```

Open <http://localhost:5173>. The sidebar status pill shows the LLM provider
reported by the backend's `/health` endpoint — green text means wired, "backend
unreachable" means start the backend first.

If your backend lives elsewhere, set `VITE_BACKEND_URL` in `.env`:

```
VITE_BACKEND_URL=http://192.168.1.10:8765
```

## Build

```powershell
npm run build        # emits dist/
npm run preview      # serve the production build for a final sanity check
```

## Project layout

```
src/
├── App.tsx              top-level layout + active-mode state
├── main.tsx             React root
├── index.css            Tailwind v4 + theme tokens (CSS variables)
├── components/
│   ├── Sidebar.tsx      sidebar with mode pill, recent list, theme toggle
│   ├── Header.tsx       app header with mode-color badge
│   ├── ModePill.tsx     Chat / Library / Analysis selector
│   └── WelcomeView.tsx  per-mode landing content
├── hooks/
│   └── useTheme.ts      dark/light theme persisted to localStorage
└── lib/
    ├── api.ts           typed REST client (bearer auth via localStorage)
    └── types.ts         shared shapes mirroring backend Pydantic models
```

## Status

This is the **Phase 2 kickoff** commit. Ships the app shell, sidebar,
mode-pill switcher, dark/light theme, and a typed API client wired to the
backend's `/health`. Chat / Library / Analysis surfaces still show welcome
placeholders — they get built in subsequent commits:

- [ ] Chat mode: message list, composer, SSE streaming
- [ ] Library mode: clause browser + Gemini-style composer
- [ ] Analysis mode: upload + compliance + brief
- [ ] Settings drawer + bearer-auth flow
- [ ] Responsive + accessibility polish
- [ ] Dockerfile + nginx serve + CI

## Tech stack

React 19 · Vite 8 · TypeScript 7 · Tailwind v4 · `fetch` + `EventSource`

## License

MIT — see [LICENSE](LICENSE).
