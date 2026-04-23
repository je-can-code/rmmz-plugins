---
status: open
area: code-quality
---

# Reconcile RPG Maker MZ engine `.d.ts` with vanilla `project/js/rmmz_*.js`

## Severity

**Medium.** Invented or outdated types mislead plugin authoring, hide real APIs, and waste time chasing symbols that never existed on stock MZ (including bad assumptions baked into legacy definition blobs).

## Gain

**High for trust.** IDE autocomplete and TypeScript consumers (`jmz-data-editor`, future tooling) align with **runtime truth** kept in-repo as copies of the Chef Adventure engine under `project/js/rmmz_*.js`.

## Source of truth (runtime)

- `project/js/rmmz_core.js`
- `project/js/rmmz_managers.js`
- `project/js/rmmz_objects.js`
- `project/js/rmmz_scenes.js`
- `project/js/rmmz_sprites.js`
- `project/js/rmmz_windows.js`

## Current state (`src/defs`)

- `rmmz_*.d.ts` files were split out from **`lunalite-pixi-mz.d.ts`** for readability; Lunalite still anchors much of `rm.types` / Pixi-adjacent shapes via imports from `rmmz_core.d.ts`, `rmmz_windows.d.ts`, etc.
- **Suspected issue:** that lineage often carries **extra** APIs (extended-engine fantasy, wrong shapes) and **omits** vanilla members — local patches already accumulated where reality diverged.

## Context

RPG Maker MZ ships JavaScript only; every `.d.ts` is synthetic. This repo already versions **real** engine files beside the plugins — definitions should **follow those copies**, not treat a third-party mega-file as ground truth.

## Work — Path A (recommended): **Cross-check / reconcile**

1. Per **file pair** (e.g. `rmmz_objects.js` ↔ `rmmz_objects.d.ts` plus any shared `rm.types` entries that describe the same shapes): enumerate **globals, classes, `prototype` chains** from JS (manual pass, ripgrep, or a small AST helper).
2. **Delete** declarations that **do not exist** in `project/js` (trim Lunalite / fantasy surface aggressively where it conflicts with vanilla).
3. **Add** symbols that exist in JS but are missing from `.d.ts` (acceptable to start permissive on signatures, then tighten hotspots).
4. Keep **JMZ-only** augmented types (hydrated DB rows, plugin globals) in a **separate** ambient module so vanilla vs extensions never blur.
5. Record in a short header or comment **which CA / MZ build** the `project/js` snapshot came from so future engine upgrades are a conscious diff.

**Exit criteria:** Spot-checks show major classes/globals from JS are represented; known phantom members on core shapes are removed or quarantined.

## Work — Path B: **Greenfield from JS**

1. Treat `project/js/rmmz_*.js` as the **only** spec; author **new** declarations per module (or a deliberate rollup), minimizing inheritance from Lunalite.
2. Rewire `src/defs` so imports resolve without the bloated central blob; remove or radically shrink **`lunalite-pixi-mz.d.ts`** once `rm.types` / Pixi needs are replaced or narrowed.
3. Same split for **JMZ-only** declarations.

**When to choose Path B:** If reconciliation finds Lunalite-derived layers are **mostly** unreliable and rewriting **one pilot module** (often `rmmz_objects` or `rmmz_core`) is faster than forensic patching — scale to the rest only after conventions are settled.

## Notes

- External community packs (public “full MZ” typings) are **hints** — always **diff against `project/js`** before trusting a symbol.
- Optional accelerator: a script that extracts `Foo.prototype.bar` / top-level `function Foo` names from each `rmmz_*.js` and lists `.d.ts` gaps or extras — speeds Path A without replacing human judgment.
