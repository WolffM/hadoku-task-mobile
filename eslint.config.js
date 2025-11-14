import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['www/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        Capacitor: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 4],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always']
    }
  }
];
