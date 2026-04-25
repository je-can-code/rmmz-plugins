import js from '@eslint/js';

/**
 * Flat config (ESLint 10+). Replaces legacy .eslintrc.yaml — keep in sync with
 * workspace style notes in .cursor/rules/workspace.mdc.
 *
 * Uses the default ESLint (Espree) parser. @babel/eslint-parser 7.x is not
 * compatible with ESLint 10's scope APIs; reintroduce Babel when on
 * @babel/eslint-parser 8 + @babel/core 8 if you need nonstandard syntax.
 */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/out/**',
      '**/coverage/**',
      '**/dist/**',
      '**/rmmz_*.js',
      '**/*.d.ts',
      'src/external/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Added to @eslint/js recommended in newer majors; not part of the old YAML-era baseline.
      'preserve-caught-error': 'off',

      'no-case-declarations': 'off',
      'no-empty-function': 'off',
      'no-undef': 'off',
      'no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '(?:(^[RPG|JABS|Window|Sprite|Scene|Game])|(Manager$|Builder$))',
          // Intentional unused args: single `_` or `_foo` (extension points / future hooks).
          argsIgnorePattern: '^(_$|_.+)$',
        },
      ],
      'no-useless-call': 'off',
      'no-prototype-builtins': 'off',

      eqeqeq: 'error',
      complexity: ['warn', 20],
      indent: ['error', 2, { SwitchCase: 1 }],

      'no-eq-null': 'error',
      'no-lone-blocks': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-nested-ternary': 'error',
      'no-new': 'error',
      'no-new-wrappers': 'error',
      'no-param-reassign': 'warn',
      'no-promise-executor-return': 'error',
      'no-shadow': 'error',
      'no-unexpected-multiline': 'error',
      'no-void': 'error',

      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'prefer-destructuring': 'warn',

      'eol-last': ['error', 'never'],
      'brace-style': ['error', 'allman'],
      'max-len': ['error', { code: 120 }],
    },
  },
  {
    files: [
      'src/plugins/**/__models/**/*.js',
      'src/plugins/**/_models/**/*.js',
      'src/plugins/drops/models/**/*.js',
      'src/plugins/log/_models/**/*.js',
    ],
    rules: {
      // Model classes: the binding name is the registration/serialization id; other files
      // reference the global or JsonEx, not a local import—so local "unused" is expected.
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/_annotations.js'],
    rules: {
      // Workspace: 120 for most plugin files; annotation tables may exceed that without wrapping.
      'max-len': ['error', { code: 200 }],
    },
  },
];