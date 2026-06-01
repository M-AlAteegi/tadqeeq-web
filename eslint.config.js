import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // `set-state-in-effect` fires on legitimate sync-from-prop /
      // reset-on-dep-change patterns we use deliberately (e.g.
      // restoring chat state when chatId changes, adopting a doc
      // pushed down from App). The rule isn't aware of dependency
      // arrays so it can't tell those apart from real cascading
      // re-render bugs.
      'react-hooks/set-state-in-effect': 'off',
      // The vite plugin's rule wants every module to export ONLY
      // components for HMR boundaries. Toast.tsx exports both a
      // Provider and a useToast hook because they share a context —
      // splitting them would force a circular import. Allow it.
      'react-refresh/only-export-components': 'off',
    },
  },
])
