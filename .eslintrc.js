module.exports = {
  'root': true,
  'plugins': [],
  'env': {
    'node': true,
    'commonjs': true,
    'es6': true,
    'jquery': false,
    'jest': true,
  },
  'extends': [
    'eslint:recommended',
  ],
  'parserOptions': {
    'sourceType': 'module',
    'ecmaVersion': '2018'
  },
  'rules': {
    'indent': [
      'warn',
      2,
      {'SwitchCase': 1}
    ],
    'quotes': [
      'warn',
      'single'
    ],
    'semi': [
      'error',
      'never'
    ],
    'no-var': [
      'error'
    ],
    'no-console': [
      'off'
    ],
    'no-unused-vars': [
      'warn',
      {
        varsIgnorePattern: '_',
        argsIgnorePattern: '_'
      }
    ],
    'no-mixed-spaces-and-tabs': [
      'warn'
    ]
  }
}
