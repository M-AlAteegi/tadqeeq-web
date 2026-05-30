import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND_URL || 'http://127.0.0.1:8765'
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // Dev convenience: proxy /api → backend so the browser doesn't need
      // CORS pre-flights and we don't have to bake the URL into the bundle.
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/health': { target: backend, changeOrigin: true },
      },
    },
  }
})
