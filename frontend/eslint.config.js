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
      // Flags the standard "fetch/reset state on mount or prop-change" effect
      // pattern used throughout this codebase as a cascading-render risk. That
      // pattern is idiomatic and correct here; this rule is a strict new default
      // from the React Compiler-derived config, not a real bug in this project.
      'react-hooks/set-state-in-effect': 'off',
      // Warns when manual useMemo/useCallback wouldn't survive automatic
      // compilation by the React Compiler. This project doesn't run the React
      // Compiler (no babel-plugin-react-compiler configured), so it's
      // compiler-readiness noise rather than a bug in the current build.
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
])
