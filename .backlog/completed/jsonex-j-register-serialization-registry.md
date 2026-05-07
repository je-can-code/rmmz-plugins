---
status: done
area: architecture
---

# Implement `JsonEx` serialization registry in J-Base

## Severity

**Medium-high** over time. Saves can fail or resurrect wrong types when minification, renaming, or `window` pollution breaks `JsonEx`’s `window[className]` lookup. Historically this repo relied on prototype constructors and/or explicit global exports as an implicit registry.

## Gain

**Very high** for long-term correctness and tooling. A central registry makes save format evolution predictable and enables modern `class` syntax for save-persisted models without relying on globals.

## Source

- `.junie/guidelines.md` — “JsonEx serialization registry” section (design sketch)
- Serializable models scattered under `src/plugins/**/__models/` and `objects/`

## Context

`JsonEx._decode` needs a reliable way to resolve a constructor by a type tag (typically `value['@']`). Modern `class` declarations do not automatically become `window.SomeClass`, forcing either prototype constructors or explicit `window.SomeClass = SomeClass` hacks.

## Completed work

1. Added `SerializableRegistry` as a static class in J-Base core:
   - File: `src/plugins/_base/core/SerializableRegistry.js`
   - API:
     - `SerializableRegistry.register(constructor, { id?, aliases? }?)`
     - `SerializableRegistry.resolve(id)`
2. Extended `JsonEx._decode` to consult the registry first, then fall back to legacy `window[className]` lookup:
   - File: `src/plugins/_base/core/JsonEx.js`
   - Behavior: `SerializableRegistry.resolve(value['@']) || window[value['@']]`
3. Pilot adoption for a concrete pain point model:
   - Updated `src/plugins/abs/ext/hitstop/_models/JABS_HitstopData.js`
   - Replaced `window.JABS_HitstopData = JABS_HitstopData;` with `SerializableRegistry.register(JABS_HitstopData);`
4. Added a focused test proving prototype restoration without `window`:
   - File: `test/plugins/_base/jsonex-serializable-registry.test.js`
   - Confirms `JsonEx.makeDeepCopy(new JABS_HitstopData())` restores prototype + methods even when `window.JABS_HitstopData` is unset.
5. Updated the J-Base VM test harness to provide engine globals required by J-Base parse-time aliases:
   - File: `test/plugins/_base/fixtures/install-j-base-host-globals.js`
   - Added minimal `JsonEx` implementation and a `window` alias.

## Notes

- Backwards compatibility remains via the `window[...]` fallback path.
- Coordinate with `game-action-battler-uuid-refactor.md` if stored actions or battler handles change shape.
