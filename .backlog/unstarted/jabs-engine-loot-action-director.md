# Loot and action helpers extracted from `JABS_Engine`

## Source

- `src/plugins/abs/core/managers/JABS_Engine.js` (helpers around line 2710; line may drift)

## Severity

**Low** immediate risk; **medium** maintainability drag as `JABS_Engine` grows.

## Gain

**Medium-high** — smaller engine type, easier testing of loot/action policy; prerequisite for some perf work.

## Context

Several helper closures inside `JABS_Engine` were flagged for extraction into a reusable collaborator (e.g. `JABS_LootDirector` or `JABS_ActionDirector`). Extraction is easier after you know **who else** patches `JABS_Engine` today.

### Same engine surface elsewhere (merge from audit)

Plugins ship `JABS_Engine` prototype extensions or related engine hooks, including:

- ABS: `allyai`, `formula`, `input`, `tools`, `hitstop`, `shield`, `diag`
- Non-ABS: `sdp`, `apt/ext/typed`, `regions/ext/skills`, `map`, `omni/ext/monster`
- Popups ABS bridge: `popups/ext/abs/managers/J_POPABS_Engine.js`
- `__ca-mods/managers/JABS_Engine.js` (Chef Adventure overrides — see `ca-mods-boundary.md`)

Full path list: `cross-plugin-prototype-hook-surface.md`.

## Work

Identify the helpers near that region, extract a named class or module-namespace object, and have `JABS_Engine` delegate to it without behavior changes. Prefer extracting **loot/action** helpers before touching hook registration order.

## Definition of done

- [ ] the extracted collaborator exists as its own file with its own `//region`, and `JABS_Engine.js`
      is shorter by roughly the body that moved
- [ ] the collaborator has its own test file covering the loot and action policy branches. The stated
      gain is "easier testing of loot/action policy", so an extraction that lands without tests has
      delivered the churn and not the gain
- [ ] `bun run hotfix` green and coverage still 100%
- [ ] in-game: kill an enemy that drops loot and pick it up; kill another and walk away from the
      drop; then kill a third while the second drop is still on the ground. Nothing double-collects
      and nothing vanishes early

## Notes

- Pairs with `cached-actions-map.md` if live-action storage moves to a Map collaborator owned by the same director object.
