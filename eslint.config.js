// Konfigurasi ESLint untuk MELINT source code project token-drift sendiri
// (bukan contoh config untuk end-user memakai plugin ini — itu ada di playground/ nanti).
export default [
  {
    ignores: ['node_modules/**', 'playground/**', 'coverage/**'],
  },
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
];
