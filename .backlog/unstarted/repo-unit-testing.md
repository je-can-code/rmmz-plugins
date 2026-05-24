---
status: open
area: core
---

# Unit Testing Infrastructure

## Summary (updated)

Vitest + `test/` harnesses **already exist** (see `.junie/guidelines.md`: `bun run test`, shipped-plugin VMs, `_base`, `sdp`, `apt`, etc.). This backlog item is retargeted from “introduce testing” to **expand and standardize coverage** where gaps remain.

All ships build via Vite (`bun run build:all` / `hotfix`); tests evaluate **`out/`** bundles, not source modules directly.

## Severity

**Medium.** Missing tests slow refactors on high-risk areas (notes, save data, ABS loops).

## Gain

**High over time, incremental effort.** Each new suite reduces regression risk for cross-plugin refactors (`cross-plugin-prototype-hook-surface.md`, completed `boolean-notetag-regex-audit.md`).

## Design status (resolved)

- **Runner**: Vitest / Bun test (project standard).
- **Layout**: `test/plugins/...` mirroring `src/plugins/...` per guidelines.

## Remaining work / gaps

- Add or extend coverage for: `PIXEL_CollisionManager` (if not already complete), new Popups core (`popups/core` models), JAFTING sessions post-refactor, and any plugin without a `*-vm.js` harness.
- Build-tool scripts (`copy.js`, `build-all.js`): optional pure-Node tests (mentioned in original scope).
- **Boolean note audit** (completed: `.backlog/completed/boolean-notetag-regex-audit.md`): optional follow-up is extra targeted `RPGManager` / merge-path tests if desired.

## Prerequisites

- Follow existing `evaluateShippedPlugin` / fixture patterns; do not invent a second harness.

## Notes

- Do not attempt to unit-test entire prototype override chains; use integration/manual for those.
- Pairs with [`build-tools-linting.md`](../completed/build-tools-linting.md) (oxlint gates `hotfix`).
