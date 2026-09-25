// ESLint flat config (ESLint 10+). Self-contained: no `@eslint/js`/plugin requires,
// because eslint runs from a mise-managed install whose deps aren't on the project's
// module path. Lint-only — formatting is owned by prettier — so a small set of
// correctness rules for a CommonJS Node Alfred workflow.
'use strict';

module.exports = [
  {
    ignores: ['src/node_modules/**', 'build/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        module: 'writable',
        exports: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      eqeqeq: ['warn', 'smart'],
      'no-console': 'off',
    },
  },
];
