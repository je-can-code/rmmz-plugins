---
status: open
area: architecture
---

# Convert save-persisted prototype models to modern `class` syntax

## Why

Historically, save-persisted models in this repo skew toward prototype constructors to satisfy `JsonEx`’s fragile
`window[className]` constructor lookup. With the `SerializableRegistry` + `JsonEx._decode` registry-first lookup in
place, we can move away from “prototype-only because JsonEx” and author saved models as modern `class` syntax without
polluting globals.

## Preconditions

- `SerializableRegistry` exists and `JsonEx._decode` consults it (registry-first, `window[...]` fallback).
- A pilot model has been migrated and proven via tests (`JABS_HitstopData`).
- **Vite + ESM ships (done):** source uses `class` + `export default` where applicable; see [`monorepo-vite-esm-plugin-migration.md`](../completed/monorepo-vite-esm-plugin-migration.md). This item is about **save-persisted** shapes, not the build pipeline.

## Goals

- Reduce the number of “prototype-only because save/load” models over time.
- Prefer modern `class` syntax for readability and maintenance.
- Keep save compatibility stable and predictable.

## Non-goals

- Do not mass-refactor everything in one pass.
- Do not change save shapes as part of the conversion (field names and stored structure should remain stable).
- Do not remove the `window[...]` fallback until coverage is high and migration is complete.

## Approach

- **Convert-on-touch**: when a save-persisted prototype model needs meaningful edits, convert it then.
- For each conversion:
  - Convert `function Foo() {}` + `Foo.prototype...` into `class Foo { ... }`.
  - Keep constructors parameterless (or ensure they do not rely on arguments for correctness during `JsonEx` restore).
  - Preserve field names and persisted structure.
  - Add `SerializableRegistry.register(Foo, { id?, aliases? })` once (location policy TBD per plugin family).
  - If the constructor name changes, register `aliases` so older saves still resolve.
- Add a small, focused test per plugin family (or per tricky model) proving prototype restoration without `window`.

## Notes / constraints

- `JsonEx` rehydrates by prototype + assigning fields; it does not reliably run constructors during load.
  - Derived/ephemeral state must be recomputed lazily or normalized post-restore (pattern: `normalizeX()`).
- `Map`/`Set`/`Date` are not JSON-native; conversions must preserve existing normalization patterns.

## Suggested initial targets

- Start with low-coupling, high-value saved models in ABS/JAFTING/SDP that are frequently touched.
- Avoid models with complex invariants or heavy engine coupling until patterns are established.
