# Unify `TextPopBuilder` prototype extensions (Popups vs Aptitude vs Shield)

## Severity

**Medium.** Load-order bugs can drop fluent methods (`isAptitude`, `isShieldDamage`) if Popups core is not present before extension patches. Conditional `if (J.POPUPS)` in Aptitude is correct defensively but splits ownership.

## Gain

**Medium-high.** Single obvious place for “map popup styling” behavior (J-Popups core or `popups/ext/*`) makes the Popups plugin the hub for all `TextPopBuilder` methods; Shield and Aptitude only register **types** or **colors** via that hub. Reduces cognitive load when adding new pop sources (SDP/AP/ABS already live under `popups/ext/*`).

## Source

- **Core class:** `src/plugins/popups/core/_models/TextPopBuilder.js`
- **Aptitude extension (guarded):** `src/plugins/apt/core/_models/TextPopBuilder.js` — defines `TextPopBuilder.prototype.isAptitude` when `J.POPUPS`
- **Shield extension:** `src/plugins/abs/ext/shield/managers/TextPopBuilder.js` — `isShieldDamage`, `isShieldBreak`
- **Consumers:** `src/plugins/popups/ext/apt/managers/J_POPAPT_Engine.js`, `popups/ext/sdp/managers/J_POPSDP_Engine.js`, `popups/ext/abs/managers/J_POPABS_Engine.js`, `popups/ext/abs/objects/J_POPABS_Battler.js`

## Context

After the Popups split from J-TextPops, the class lives in Popups core, but Aptitude still ships a patch in `apt/core` and Shield patches from `abs/ext/shield`. That mirrors historical coupling (ABS owns shield) but fights the namespace rule that Popups owns map pop presentation.

## Work

1. Decide ownership: **recommended** — move Shield-specific fluent methods into `src/plugins/popups/ext/abs/` or a new `popups/ext/shield/` bundle that depends on J-ABS-Shield for *data* only, not on defining `TextPopBuilder` in ABS.
2. Move `isAptitude` from `apt/core/_models/TextPopBuilder.js` into `popups/ext/apt/` (already have `J_POPAPT_Engine.js`).
3. Document required plugin order in Popups `_annotations.js` / help text.
4. Grep for `new TextPopBuilder` after changes to ensure no orphan imports.

## Notes

- Ties into `cross-plugin-prototype-hook-surface.md` (prototype extension graph).

## What shipped

- Aptitude fluent builder lives in `src/plugins/popups/ext/apt/_models/TextPopBuilder.js`; `apt/core/_models/TextPopBuilder.js` now points to Popups ownership.
- Shield fluent builders live in `src/plugins/popups/ext/abs/_models/TextPopBuilder.js`; `abs/ext/shield/managers/TextPopBuilder.js` now points to Popups ownership.
