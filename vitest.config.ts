import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/examples/**',
        '**/__tests__/**',
        'vitest.config.ts',
      ],
    },
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
