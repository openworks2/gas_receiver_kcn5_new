module.exports = {
  extends: ['plugin:node/recommended', 'eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2020,
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    'prefer-const': 'error',
    'no-var': 'error',
    'max-len': [
      'error',
      {
        ignoreUrls: true,
        ignoreStrings: true,
        code: 100,
      },
    ],
    'node/no-unpublished-require': 0,
    eqeqeq: 2,
    'no-return-assign': 2,
    'no-return-await': 2,
    'newline-after-var': 2,
    'no-console': [
      'error',
      {
        allow: ['info', 'warn', 'error'],
      },
    ],
    'line-comment-position': [
      'error',
      {
        position: 'above',
      },
    ],
  },
}
