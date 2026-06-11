---
status: open
area: architecture
---

# Divide `initialization.js` into init vs namespacing (cross-ship)

## Source

- `src/plugins/abs/core/_metadata/initialization.js` (J-ABS; pattern repeats on other ships)
- `src/plugins/abs/core/_metadata/_pluginMetadata.js` (had imported `JABS_State` for one default string)
- Shipped bundle eval order: Rolldown emits/evaluates modules by dependency graph, not `entry.js` import list order
- Brief experiment: `namespace.js` split in this PR, reverted — see changelog 4.12.4 note / backlog

## Context

`initialization.js` is the plugin bootstrap: `J.*` namespace, `RegExp`, `Shapes`, `Directions`, `Aliased`, metadata wiring, etc.

If `initialization.js` imports **any** feature module (e.g. `_pluginMetadata` → `JABS_State`), the bundler evaluates that entire subgraph **before** the rest of `initialization.js` runs. Static class fields in pulled modules (e.g. `JABS_HitboxPulseOptions.defaults()` reading `J.ABS.Shapes`) can throw at load time.

**Minimal fix shipped (J-ABS 4.12.4 PR):** remove model imports from `_pluginMetadata`; use literal `'refresh'` for default state reapply type until a canonical constant lives in bootstrap.

**Deferred (this item):** structural split applied **universally** across ships:

| Module | Role |
|--------|------|
| `namespace.js` (name TBD) | `J.*` constants only — **zero** imports from the ship's feature tree |
| `initialization.js` | Metadata class, plugin params, external config, alias maps that need metadata |

`entry.js`: `namespace` → `initialization` → feature modules.

Also audit every `_pluginMetadata.js` (and similar) for imports that pull models only to reference a constant — replace with bootstrap literals or shared const in namespace module.

## Work

1. Document policy in `.junie/guidelines.md` (bootstrap must not import feature modules).
2. Pilot on J-ABS (re-apply split cleanly; optional `J.ABS.StateReapplyType` in namespace).
3. Inventory other ships' `initialization.js` / `_pluginMetadata` import leaks; fix or split per ship.
4. Extend `verify:ships` (or new gate): flag `_pluginMetadata` / `initialization.js` importing from `__models/`, `managers/`, etc.
5. Remove VM test prelude `test/plugins/abs/fixtures/abs-pre-jabs-prelude.js` once bundle order is guaranteed by structure.

## Acceptance

- Fresh `bun run hotfix` → load game with J-ABS (and pilot ships) without `J.ABS.Shapes` / metadata static-init crashes.
- No feature-module `import` in namespace/bootstrap files across audited ships.
- Changelog + backlog cross-link when a ship migrates.
