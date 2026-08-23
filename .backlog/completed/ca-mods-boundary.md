# Clarify `__ca-mods` boundary vs shipped plugins

## Severity

**Low** for open-source consumers who omit the tree. **Medium** for monorepo hygiene: Chef Adventure–specific overrides can accidentally become the “source of truth” for behavior that belongs in core or an optional ext.

## Gain

**Medium for clarity.** Explicit policy (what belongs in `__ca-mods` vs `abs/core` vs a new ext) avoids duplicated fixes and confusing PR scope. Low effort if the outcome is mostly documentation + occasional moves.

## Source

- `src/plugins/__ca-mods/` — e.g. `managers/JABS_Engine.js` (very large override count vs other ABS extensions), `objects/Game_Party.js`, `Game_Action.js`, `_models/JABS_Battler.js`

## Context

The directory is documented in guidelines as CA-exclusive. It still participates in the same Vite build pipeline as reusable plugins, so diffs here are easy to miss in cross-game testing.

## Work

1. Write a short rule in `.junie/guidelines.md` or `.backlog/README.md` pointer: when to promote a change from `__ca-mods` into a real plugin.
2. Review `__ca-mods/managers/JABS_Engine.js` against `cross-plugin-prototype-hook-surface.md` — ensure CA overrides are listed in any hook inventory.
3. Optionally split CA mods into “generated” vs “hand-maintained” if some files are stable enough to upstream.

## Notes

- Does not require changes to the `ca` game repo; scope is `rmmz-plugins` only per user request.
