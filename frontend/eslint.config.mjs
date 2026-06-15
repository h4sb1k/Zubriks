import love from 'eslint-config-love'
import prettier from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import globals from 'globals'

export default [
  {
    ignores: ['node_modules', 'dist', 'build', 'eslint.config.mjs'],
  },
  {
    ...love,
    files: ['**/*.js', '**/*.ts', '**/*.tsx', '**/*.jsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // ✅ Указываем только те tsconfig, которые включают исходники
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
        
        // ✅ Для файлов, которые не попали ни в один tsconfig (например, main.tsx)
        allowDefaultProject: ['*.tsx', '*.ts'],
        
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      react,
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'import/order': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'curly': ['error', 'all'],
      'no-irregular-whitespace': ['error', {
        skipTemplates: true,
        skipStrings: true,
      }],
      'no-console': ['error', { allow: ['info', 'error', 'warn'] }],
    },
  },
  prettier,
]