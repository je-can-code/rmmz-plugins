---
status: done
area: code-quality
---

# Reconcile RPG Maker MZ engine `.d.ts` with vanilla `project/js/rmmz_*.js`

## Summary

Original goal: stop trusting third-party / hand-split monoliths and align declarations with the **in-repo vanilla engine** under `project/js/rmmz_*.js`.

**Path B (greenfield from JS) shipped:** a generator produces mergeable ambient fragments under `src/defs/generated/rmmz/`, driven by `bun run defs:generate` (`src/build-tools/generate-rmmz-engine-defs.js` + `rmmz-defs-infer.js`). Legacy `src/defs/rmmz_*.d.ts` and `lunalite-pixi-mz.d.ts` are retired from that approach in favor of generated output + `src/defs/pixi.d.ts` where needed.

## What shipped (v1.0 scope)

- Per-stem fragments (core, managers, objects, scenes, sprites, windows) + `index.d.ts` triple-slash graph.
- Inferred instance / namespace `this._*` fields with usage-linked JSDoc where implemented.
- Prototype inheritance from `Child.prototype = Object.create(Parent.prototype)` → `interface Child extends Parent`.
- `Object.defineProperties` / `Object.defineProperty` accessors (e.g. `Game_BattlerBase` stat getters, `Game_CharacterBase` x/y, manager volume getters, `TextManager` terms).
- Topological ordering of `index.d.ts` references so `extends` bases resolve.

## Notes

- JMZ-only augmented types (hydrated DB rows, plugin globals) remain a **separate** concern from vanilla engine fragments; do not blur them into the generated tree.
- Follow-ups (if any): lint generated `.d.ts`, stronger inference for remaining `unknown`, engine version header for `project/js` snapshot.
