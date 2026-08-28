# After `bun run plugin:init <path>`

Replace placeholders before your first `bun run hotfix`:

1. **Namespace** — Rename `J.__TEMPLATE__`, `J__TEMPLATE___PluginMetadata`, and `__TEMPLATE__` in annotations/help to your plugin (e.g. `J.CRIT`, `J_CriticalFactorsPluginMetadata`, `CRIT`).
2. **`_metadata/meta.js`** — Set `PLUGIN_NAME` (ship id, usually matches filename without `.js`), `PLUGIN_VERSION`, `PLUGIN_DESC_TAG`.
3. **`vite.config.js`** — Rename to `vite.config.<family>.js`; fix `import shared from '…/vite.config.shared.js'` depth; set `rolldownOptions.input` key to your `out/` path (e.g. `crit/J-CriticalFactors`).
4. **`entry.js`** — Add `import './…'` lines for each new source file (keep `initialization.js` first).
5. **Chef Adventure** — Register the built plugin in that game's own `js/plugins.js`, under `js/plugins/j/…`. This repo has no manifest of its own to update: `project/` holds the vendored engine and the committed mirror of `out/`, not a loadable project.
6. **`docs/notetag-reference.md`** — If the plugin introduces notetags, add their entries. A tag ships with its glossary entry, in the same PR.

**There is no build script to add.** `build-all.js` finds ships by globbing `src/plugins/**/vite.config.*.js`, so step 3 is what puts your plugin into the build — the config *is* the registration. This used to be a hand-written `package.json` entry, and forgetting it meant the ship silently never built.

Plugin commands must use `J.*.Metadata.name` (lowercase), not `.Name`.