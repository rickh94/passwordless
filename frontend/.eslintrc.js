module.exports = {
  env: {
    browser: true,
    es6: true,
    mocha: true
  },
  extends: ['eslint:recommended', 'plugin:lit/recommended', 'plugin:mocha/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    babelOptions: {
      configFile: '.babelrc',
    },
  },
  plugins: ['lit', 'mocha'],
  rules: {
    indent: [
      'warn',
      2,
      {
        SwitchCase: 1,
      },
    ],
    'linebreak-style': ['error', 'unix'],
    quotes: ['warn', 'single'],
    semi: ['warn', 'never'],
    'no-unused-vars': 'off',
  },
}
