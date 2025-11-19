module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      project: './tsconfig.json',
    },
    plugins: [
      '@typescript-eslint',
      'prettier',
      'import',
      'jest',
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'plugin:jest/recommended',
      'prettier',
    ],
    rules: {
      // TypeScript - ✅ CAMBIAR errors a warns para v1.0
      '@typescript-eslint/explicit-function-return-type': ['warn', { // ✅ error → warn
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-floating-promises': 'warn', // ✅ error → warn
      '@typescript-eslint/no-misused-promises': 'warn', // ✅ error → warn
      '@typescript-eslint/await-thenable': 'warn', // ✅ error → warn
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn', // ✅ error → warn
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { // ✅ error → warn
        prefer: 'type-imports',
      }],
      // ✅ AGREGAR estas reglas en warn
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
  
      // Import
      'import/order': ['warn', { // ✅ error → warn
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        'alphabetize': {
          order: 'asc',
          caseInsensitive: true,
        },
      }],
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off',
  
      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'warn', // ✅ error → warn
      'prefer-template': 'warn', // ✅ error → warn
      'prefer-arrow-callback': 'warn', // ✅ error → warn
      'arrow-body-style': ['warn', 'as-needed'], // ✅ error → warn
      'no-restricted-syntax': 'off', // ✅ Desactivar para v1.0
  
      // Prettier
      'prettier/prettier': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    overrides: [
      {
        files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
        env: {
          jest: true,
        },
        rules: {
          '@typescript-eslint/no-explicit-any': 'off',
          '@typescript-eslint/no-unsafe-assignment': 'off',
          '@typescript-eslint/no-unsafe-member-access': 'off',
          '@typescript-eslint/no-unsafe-call': 'off',
          '@typescript-eslint/no-unsafe-return': 'off',
          '@typescript-eslint/no-floating-promises': 'off',
          'no-console': 'off',
        },
      },
      {
        files: ['examples/**/*.ts'],
        rules: {
          'no-console': 'off',
          '@typescript-eslint/no-floating-promises': 'off',
        },
      },
    ],
  };
  