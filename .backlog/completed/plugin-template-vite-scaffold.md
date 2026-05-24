---
status: done
area: architecture
completed: 2026-05-24
parent: monorepo-vite-esm-plugin-migration.md
---

# Plugin template: Vite ship scaffold

## Summary

`src/plugin-template/` updated so `bun run plugin:init <path>` copies a ship that matches the post-migration monorepo (no pre-Vite `var J` / hardcoded metadata constructor).

## What shipped

- `_metadata/meta.js` — `PLUGIN_NAME`, `PLUGIN_VERSION`, `PLUGIN_DESC_TAG` for Vite defines.
- `initialization.js` — ESM import, `globalThis.J`, J-Base 3.0.0 gate, `__PLUGIN_NAME__` / `__PLUGIN_VERSION__`.
- `_pluginMetadata.js` — `export default`; `pluginCommands.js` already used `Metadata.name`.
- `_annotations.js` — `@@PLUGIN_VERSION@@` / `@@PLUGIN_DESC_TAG@@`.
- `entry.js` — imports initialization + pluginCommands.
- `vite.config.js` — starter config with TODOs for `out/` key and `../` depth to `vite.config.shared.js`.
- `SCAFFOLD.md` — post-init checklist (namespace rename, `package.json` `build:*`, CA `plugins.js`).
- `init.js` comment + `README.md` / `.junie/guidelines.md` point at scaffold flow.

## Notes

- `J.__TEMPLATE__` placeholders remain until the author renames during scaffold (unchanged convention).
