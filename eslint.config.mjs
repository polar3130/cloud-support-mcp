import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginTypeScript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/'],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': eslintPluginTypeScript,
      prettier: eslintPluginPrettier,
    },
    files: ['**/*.ts', '**/*.js'],
    rules: {
      ...eslintPluginPrettier.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      ...eslintPluginTypeScript.configs.recommended.rules,
    },
  },
  {
    files: ['test/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
