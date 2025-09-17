import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 3000, // 3 second timeout
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: ['node_modules/', 'dist/', 'test/', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
});
