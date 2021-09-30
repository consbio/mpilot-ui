module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts', '.svelte'],
      },
    },
    'svelte3/typescript': true,
    'svelte3/ignore-styles': () => true,
  },
  extends: ['eslint:recommended', 'plugin:import/recommended'],
  rules: {},
  overrides: [
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3',
    },
  ],
  plugins: ['@typescript-eslint', 'svelte3'],
};
