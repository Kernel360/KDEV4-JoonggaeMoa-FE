/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['react-refresh', 'react', '@typescript-eslint', 'react-hooks'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-expressions': 'off',
    'no-unused-expressions': 'off',
    'no-undef': 'off',
    'no-prototype-builtins': 'off',
    'no-empty': 'off',
    'no-constant-condition': 'off',
    'no-func-assign': 'off',
    'no-cond-assign': 'off',
    'no-fallthrough': 'off',
    'no-useless-escape': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/ban-types': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'prefer-const': 'warn',
    'no-case-declarations': 'off',
    'no-inner-declarations': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}; 