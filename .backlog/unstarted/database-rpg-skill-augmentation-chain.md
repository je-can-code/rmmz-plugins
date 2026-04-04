---
status: open
area: architecture
---

# Coordinate `RPG.Skill` database augmentations (note parsing load order)

## Severity

**Medium.** Skills drive combat, slots, tools, poses, formulas, and Skill Extend. Inconsistent note parsing order can yield different effective skill metadata depending on plugin list order in `plugins.js`.

## Gain

**Medium.** Documented contract + optional consolidation of “skill note” reads into RPGManager or a single ABS-owned pass reduces duplicate regex work and reviewer confusion.

## Source (`database/RPG_Skill.js` fragments)

- `src/plugins/abs/core/database/RPG_Skill.js`
- `src/plugins/abs/ext/formula/database/RPG_Skill.js`
- `src/plugins/abs/ext/charge/database/RPG_Skill.js`
- `src/plugins/abs/ext/poses/database/RPG_Skill.js`
- `src/plugins/abs/ext/tools/database/RPG_Skill.js`
- `src/plugins/sks/database/RPG_Skill.js`
- `src/plugins/extend/database/RPG_Skill.js`

## Context

Multiple plugins patch `RPG_Skill` prototype or re-run note-derived initialization. This is idiomatic for RMMZ but hard to reason about without a matrix of “which plugin adds which cached fields.”

## Work

1. Build a table: plugin → file → properties added → alias namespace.
2. Identify redundant scans of `this.note` during boot (performance micro-optimization opportunity).
3. Where safe, merge passive parsers into RPGManager-style caches already used elsewhere.
4. Add a short doc for authors: “Adding a new skill tag — register here first.”

## Notes

- `cross-plugin-prototype-hook-surface.md` is the umbrella; this item is **data-layer** specific.
- Skill Slots (`sks`) and ABS extensions interact most often; test with combine order used in shipped bundles.
