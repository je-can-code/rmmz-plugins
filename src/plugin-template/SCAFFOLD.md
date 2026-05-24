# After `bun run plugin:init <path>`

Replace placeholders before your first `bun run hotfix`:

1. **Namespace** — Rename `J.__TEMPLATE__`, `J__TEMPLATE___PluginMetadata`, and `__TEMPLATE__` in annotations/help to your plugin (e.g. `J.CRIT`, `J_CriticalFactorsPluginMetadata`, `CRIT`).
2. **`_metadata/meta.js`** — Set `PLUGIN_NAME` (ship id, usually matches filename without `.js`), `PLUGIN_VERSION`, `PLUGIN_DESC_TAG`.
3. **`vite.config.js`** — Rename to `vite.config.<family>.js`; fix `import shared from '…/vite.config.shared.js'` depth; set `rolldownOptions.input` key to your `out/` path (e.g. `crit/J-CriticalFactors`).
4. **`package.json`** — Add `"build:<family>": "vite build --config src/plugins/…/vite.config.<family>.js"`.
5. **`entry.js`** — Add `import './…'` lines for each new source file (keep `initialization.js` first).
6. **Chef Adventure / project** — Register the built plugin in `plugins.js` under `js/plugins/j/…`.

Plugin commands must use `J.*.Metadata.name` (lowercase), not `.Name`.