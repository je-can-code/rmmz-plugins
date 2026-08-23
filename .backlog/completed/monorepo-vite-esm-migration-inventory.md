---
parent: monorepo-vite-esm-plugin-migration.md
updated: 2026-05-24
---

# Vite + ESM migration — plugin inventory

**Status: complete.** **69 / 69** ships use Vite. Combiner™ and migration-only `src/build-tools/` scripts are removed.

---

## Build & metadata legend

| Build | `vite build` + `entry.js` + `_metadata/meta.js` |
| **Modern metadata** | `PluginMetadata` subclass, `new …(__PLUGIN_NAME__, __PLUGIN_VERSION__)`, `@@PLUGIN_*@@` in annotations |
| **Version checks** | `J.BASE.Metadata.Version` (J-Base string); peer plugins use `J.*.Metadata.version.version()` |
| **Plugin commands** | `PluginManager.registerCommand(J.*.Metadata.name, …)` |

---

## ESM wiring

- **In-ship:** `export default` on classes/managers; `import` graph rooted at `entry.js`.
- **`expose-globals` / `publishGlobals`:** removed from all ships.
- **J-Base database:** load order from ESM import graph.
- **Node builtins:** `external` in ship `vite.config` when required (NW.js).

---

## Validation (closure)

- `bun run hotfix` — lint, 69 ships, copy to `project/js/plugins/` + CA
- `bun run test` — Vitest against `out/`
- Manual: CA map load, ABS combat, poses (`path`/`fs` external), plugin commands (`Set JABS Skill`)

---

## Deferred

| Item | Notes |
|------|-------|
| **J-Base metadata** | Legacy `Metadata.Name` alias + string `Version` on J-Base only |
| Other backlog | `.backlog/unstarted/` |
