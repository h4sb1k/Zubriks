import love from 'eslint-config-love'
import prettier from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      'node_modules',
      'dist',
      'eslint.config.mjs',
    ],
  },
  {
    ...love,
    files: ['**/*.js', '**/*.ts', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['prisma/*.ts', '*.ts', 'eslint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // ✅ Полностью отключаем ВСЕ правила из eslint-plugin-import
      'import/order': 'off',
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/export': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-cycle': 'off',
      'import/no-relative-parent-imports': 'off',
      'import/no-duplicates': 'off',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': 'off',
      
      // ✅ Включаем только наш плагин сортировки
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Ваши кастомные правила
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