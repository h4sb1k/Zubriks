import prettier from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default [

  {
    ignores: [
      'node_modules',
      'dist',
    ],
  },
 
  {
    files: ['**/*.js', '**/*.ts', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'import/order': "off",
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