//region vitest.config
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [ 'test/**/*.test.js' ],
    silent: 'passed-only',
    coverage: {
      provider: 'v8',
      reporter: [ 'text', 'html', 'json-summary', 'lcov' ],
      reportsDirectory: './coverage',
      include: [
        'src/plugins/**/*.js',
        'out/**/*.js',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.*',
        'test/**',
      ],
      all: true,
      clean: true,
    },
  },
});
//endregion vitest.config