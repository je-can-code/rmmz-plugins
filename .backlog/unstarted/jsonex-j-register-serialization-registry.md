---
status: open
area: architecture
---

# Implement `J.register` / `JsonEx` serialization registry in J-Base

## Severity

**Medium-high** over time. Saves can fail or resurrect wrong types when minification, renaming, or `window` pollution breaks `JsonEx`’s `window[className]` lookup. Today the codebase relies on prototype constructors and global exports as an implicit registry.

## Gain

**Very high** for long-term correctness and tooling. Central registry makes save format evolution predictable; aligns with `.junie/guidelines.md` § `JsonEx` serialization registry (proposed `J.register(constructor)` + augment `JsonEx` to consult `J.SerializableRegistry` before `window`).

## Source

- `.junie/guidelines.md` — “JsonEx serialization registry” section (design sketch)
- Serializable models scattered under `src/plugins/**/__models/` and `objects/` (audit required after implementation)

## Context

This is foundational: every serializable class should register once during plugin init. Plugins that currently assign `window.SomeModel = SomeModel` for JsonEx’s benefit can migrate incrementally.

## Work

1. Implement registry + `JsonEx` hook in `src/plugins/_base/` (exact files TBD with Base maintainers).
2. Pilot-register a small set of low-risk models; verify save/load in test project.
3. Schedule phased adoption per plugin (ABS, JAFTING, SDP, etc.) with a tracking checklist.
4. Do **not** mix with unrelated refactors; keep PR focused.

## Notes

- Coordinate with `game-action-battler-uuid-refactor.md` if stored actions or battler handles change shape.
- Related to `cross-plugin-prototype-hook-surface.md` only in the sense of save data touching many systems.
