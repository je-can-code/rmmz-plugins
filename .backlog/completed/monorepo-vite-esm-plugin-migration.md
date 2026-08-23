---
completed: 2026-05-24
---

# Monorepo: migrate all plugin families to Vite + ESM source

## Summary

All **69** plugin ships build with **Vite 8 + Rolldown** (`entry.js`, `vite.config.*.js`, shared `vite.config.shared.js`, MZ header prepender). Legacy **Combiner™** (`combine.js`) and one-shot migration scripts under `src/build-tools/` are removed. Source uses ESM; runtime ships remain single bundled `.js` files in `out/`. Gameplay verified in Chef Adventure (boot, combat, poses, plugin commands).

## What shipped

- Per-ship Vite configs and `build:*` scripts in `package.json`; `build-all.js` runs them in parallel.
- `bun run hotfix` — oxlint, clean `out/`, build all, copy to `project/js/plugins/` and Chef Adventure.
- ESM `import`/`export` in `src/plugins/**`; `expose-globals` / `publishGlobals` removed.
- `PluginManager.registerCommand(J.*.Metadata.name, …)` — lowercase **`name`** (fixed J-ABS / Proficiency `.Name` registration bug).
- Node builtin `external` where needed (e.g. J-ABS Poses `path` / `fs` under NW.js).
- **Build-tools trim:** removed `combine.js`, `prepend-mz-header.js`, `wire-ship-exports.js`, `strip-ship-module-edges.js`, `generate-ship-entry.js`, `create-abs-vite-config.js`, `migrate-jabs-core-metadata.js`, `audit-dollar1.mjs`, `generate-interpreter-command-param-types.mjs`. Kept orchestration + MZ header plugin + defs generator (see root `README.md`).
- **Docs:** `README.md`, `.cursor/rules/workspace.mdc`, `.junie/guidelines.md`; backlog Combiner references updated.
- **Plugin template:** Vite scaffold (`entry.js`, `vite.config.js`, `_metadata/meta.js`, `SCAFFOLD.md`) — see [`plugin-template-vite-scaffold.md`](plugin-template-vite-scaffold.md).

## Inventory

See [`monorepo-vite-esm-migration-inventory.md`](monorepo-vite-esm-migration-inventory.md).

## Follow-ups (not this item)

- J-Base metadata modernization (`Metadata.Version` string vs `PluginVersion`; legacy `Metadata.Name` alias).
- `repo-unit-testing` (done and deleted; the repo reached 100% coverage) — expand Vitest coverage.
- [`convert-saved-prototype-models-to-modern-classes`](convert-saved-prototype-models-to-modern-classes.md) — save-persisted `class` + registry audit.
