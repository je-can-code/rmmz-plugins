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
        // the view layer is excluded by default and lifted per family as tests land, rather than all
        // at once- flipping it wholesale would add hundreds of 0% files and bury the real targets.
        //
        // J-Base-Save is the first family lifted, which is why these read as three patterns each
        // instead of one: a bare `!` negation entry is not a negation to this matcher, it inverts the
        // whole set and empties the report. Peeling the exception out segment by segment with extglob
        // is what leaves `_base/ext/save/{scenes,windows}` measured while everything else stays out.
        '**/src/plugins/!(_base)/**/scenes/**',
        '**/src/plugins/_base/!(ext)/**/scenes/**',
        '**/src/plugins/_base/ext/!(save)/**/scenes/**',
        '**/src/plugins/**/sprites/**',
        '**/src/plugins/!(_base)/**/windows/**',
        '**/src/plugins/_base/!(ext)/**/windows/**',
        '**/src/plugins/_base/ext/!(save)/**/windows/**',
        // pure JSDoc annotation blocks and trivial plugin-metadata re-exports- never contain
        // executable logic, so 0% here is permanent and not a real coverage gap. initialization.js
        // and pluginCommands.js are deliberately NOT excluded- they hold real, partially-tested
        // plugin-parameter bootstrap logic.
        '**/src/plugins/**/_metadata/_annotations.js',
        '**/src/plugins/**/_metadata/meta.js',
        // vite build config and the bare plugin entry re-export- build-time only, no runtime logic.
        '**/src/plugins/**/vite.config.*.js',
        '**/src/plugins/**/entry.js',
        // STAR is an unfinished, in-development plugin that is also disabled in the shipped game.
        // Its 0% score is expected rather than a gap, and leaving it in the report buries the real
        // targets under a permanent false alarm. Delete this line once the plugin is finished and
        // ready to be tested- it is a temporary silence, not a permanent exemption.
        '**/src/plugins/abs/ext/star/**',
      ],
      all: true,
      clean: true,
      excludeAfterRemap: true,
      // a floor, not a target. The suite runs well above this - the point of setting it here is that
      // CI fails a pull request that drops beneath it, which is a thing no amount of remembering to
      // run `hotfix` can catch.
      //
      // Ninety rather than the current number on purpose. Lifting a family's view exclusion
      // mechanically *lowers* the percentage the moment it happens - the newly measured scenes and
      // windows start at zero and get covered afterwards - so a threshold pinned to today's figure
      // would block the very work that improves it. This leaves room for that to happen a family at
      // a time, while still catching a real regression.
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
//endregion vitest.config