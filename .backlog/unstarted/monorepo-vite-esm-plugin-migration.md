---
status: open
area: architecture
---

# Monorepo: migrate all plugin families to Vite + ESM source

## Source

- `src/build-tools/combine.js` (legacy concatenation build)
- `src/build-tools/vite.config.shared.js`, `src/build-tools/vite-plugin_rmmz-header-prepender.js`
- `src/plugins/regions/core/vite.config.regions-core.js`
- `src/plugins/regions/ext/states/vite.config.regions-ext.states.js`
- `src/plugins/regions/ext/skills/vite.config.regions-ext.skills.js`
- `package.json` (`build:regions*`, `build:all` / `hotfix`)
- Branch reference: `feat/modernization/building-regions` (proof-of-concept)

## Context

The monorepo has historically shipped plugins by **lexicographic concatenation** via
Combiner™ (`combine.js`): one shared scope per ship file, path-ordered `__models/` and
`_metadata/` conventions, and **no** `import`/`export` in `src/plugins/**`.

That model works but does not scale with tooling, cross-file types, or maintainability
goals aligned with modern JavaScript.

**Regions is now the reference implementation** for a different approach:

| Ship | Build |
|------|--------|
| `J-RegionEffects` (core) | Vite 8 + Rolldown |
| `J-Regions-States` (ext) | Vite 8 + Rolldown |
| `J-Regions-Skills` (ext) | Vite 8 + Rolldown |

Proven on that branch:

- ESM `import`/`export` between colocated modules (e.g. `RegionStateData`, metadata,
  `meta.js` placeholders for MZ headers).
- Shared `vite.config.shared.js` (MZ header prepender, `treeshake: false`, no minify,
  single chunk per entry).
- Per-ship `entry.js` + colocated `vite.config.*.js` discovered from annotations/meta.
- Vitest for `test/plugins/regions` still passes; gameplay verified in Chef Adventure
  (region states re-apply, region skills, pixel `regionId`, etc.).
- Output under `out/regions/` is **not** byte-identical to Combiner output; that is
  acceptable—the contract is behavior + ship paths + plugin manager headers.

Everything else (~70+ plugin bundles via `build:all` / Combiner) remains on the old path
until migrated.

## Goal

**Transform all the things:** move the full `rmmz-plugins` plugin tree from concatenation
to the regions-style Vite pipeline, family by family, without breaking CA ship layout or
MZ load order.

This is a **major lift** (touch every plugin family, build scripts, tests, and likely
many cross-file symbol edges). It is no longer speculative—regions proved compile +
hotfix + in-game work for a multi-ship family with J-ABS dependencies.

## Work

Phased migration (suggested order is negotiable; document decisions in PRs):

1. **Harden shared tooling**
   - Stabilize `vite.config.shared.js`, header prepender, and `meta.js` / `@@PLUGIN_VERSION@@`
     substitution as the only header story.
   - Document ESM rules for plugin source (explicit exports, `globalThis.J` where ship
     scope must match engine, no accidental duplicate region wrappers on `Game_Character`
     when multiple ext entries alias the same prototype—regions skills/states ordering).

2. **Pilot the next family** (pick one medium family after regions—e.g. a single-ship
   plugin or a small ext tree) using regions as copy-paste architecture, not Combiner.

3. **Scale family-by-family**
   - Per family: `entry.js`(s), vite config(s), `build:<family>` scripts, remove
     obsolete `concat:*` entries from `package.json`.
   - Update Vitest harness paths (`out/<family>/...`) where tests load built ships.
   - Run full `hotfix` + CA smoke per family before calling it done.

4. **Retire Combiner for production builds**
   - When no plugin family uses `combine.js`, demote or delete concat scripts and
     `build-all.js` combiner path; keep a read-only doc of the old path-order rules for
     archaeology.

5. **Acceptance (whole program)**
   - All shipped plugins under `project/js/plugins/` build from Vite entries.
   - `bun run hotfix` remains the only publish path to CA.
   - No regression in plugin parameter names, `@help` ships, or `plugins.js` load order
     without intentional version bumps.

## Notes

- Regions modernization may land via `feat/modernization/building-regions` (or follow-up
  PRs); this backlog item tracks **the rest of the monorepo**, not re-doing regions.
- Related but separate: [`convert-saved-prototype-models-to-modern-classes`](convert-saved-prototype-models-to-modern-classes.md)
  (runtime `class` + `SerializableRegistry` in source)—Vite migration does not replace
  that audit.
- Related: [`repo-unit-testing`](repo-unit-testing.md)—each migrated family should
  keep or add Vitest coverage against `out/` ships where feasible.
- Do not expect byte-identical `out/` diffs vs Combiner; review behavior and ESLint on
  `src/` only.
