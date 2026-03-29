---
status: open
area: core
---

# Unit Testing Infrastructure

## Summary

Introduce a lightweight unit-testing layer for the `rmmz-plugins` monorepo so
logic-heavy functions (notetag parsers, math helpers, collision geometry, etc.)
can be verified in isolation without launching the full RMMZ engine.

## Design Questions to Resolve First

- **Runner**: Bun has a built-in test runner (`bun test`) with Jest-compatible
  `describe`/`it`/`expect`. No separate install needed.
- **Scope**: Pure-JS helpers only. Engine-dependent code (`$gameMap`, `$gamePlayer`,
  prototype overrides) needs a thin mock layer or is excluded from unit coverage.
- **Structure**: Test files alongside source (e.g., `Game_CharacterBase.test.js`)
  or in a dedicated `src/__tests__/` tree? The latter is cleaner for a monorepo.
- **What to test first** (high-ROI candidates):
  - `PIXEL_CollisionManager` geometry: `_index`, `_pixelHitbox`, seam-crossing math.
  - `RPGManager` notetag parsing helpers.
  - `PluginMetadata` version parsing.
  - Build-tool scripts (`combine.js`, `copy.js`) — these are pure Node and already
    testable today.

## Prerequisites

- Decide on mock strategy for RMMZ globals (`$gameMap`, `$dataMap`, etc.).
- Agree on file naming and location conventions.
- Add `bun test` script to `package.json`.

## Notes

- This is a large foundational effort best done incrementally: start with
  build-tool tests (zero mocking needed), then tackle pure-math helpers,
  then progressively mock engine globals for plugin logic.
- Do not attempt to test prototype-chain overrides; integration/manual testing
  is the right tool there.
