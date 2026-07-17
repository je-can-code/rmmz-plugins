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
      // 'out/**/*.js' (build output) used to be needed for VM-bundle-eval tests; that migration
      // to direct-import is complete (no test imports from out/ anymore- see
      // project-vm-to-direct-import-sweep-backlog memory). Leaving it in here actively corrupts
      // coverage numbers: any src file inlined into multiple plugin bundles (nearly every _base/
      // core file shared by several ext plugins) gets probed once per bundle via sourcemap
      // remapping, and each bundle's copy has a slightly different AST shape, so istanbul's merge
      // unions divergent statement/branch maps for the same source path- inflating the reported
      // denominator far past the real one. Confirmed empirically 2026-07-17: JABS_Battler.js
      // read 74.42%/72.59% stmts/branches with out/ included vs a true, isolation-verified 100%
      // with it excluded.
      include: [
        'src/plugins/**/*.js',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.*',
        'test/**',
        '**/src/plugins/**/scenes/**',
        '**/src/plugins/**/sprites/**',
        '**/src/plugins/**/windows/**',
      ],
      all: true,
      clean: true,
      excludeAfterRemap: true,
    },
  },
});
//endregion vitest.config