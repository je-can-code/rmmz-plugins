---
status: open
area: feature
---

# Enemy elite / boss stat knobs via passive states + configurable notetag

## Source

- Chef Adventure enemy design discussion (named vs tier HP, `Enemies.json` tuning).
- Existing passive-state pipeline (plugin that applies states for arbitrary stat scaling — wire exact plugin path when implementation starts).

## Context

**Named** enemies (`!` prefix in copy) should read as **the same tier** as their numeric placement: e.g. `!Ghastly Ghosty` is **tier 3** strength in the enemy row itself (same curve philosophy as siblings), not a hand-tweaked parallel HP formula that can end **weaker than the next tier** at high level.

**Elite / strong / boss** (and similar) should become **global tuning knobs**: one passive state (or a small family of states) bumps effective combat stats by a designer-controlled factor, so rebalance does not require touching every named row in the database.

**Distinct enemy ids** remain valid for **drops, EXP, nameplate, map `<enemyId:n>`**, while stat punch-up lives in **states + tags**, not duplicated bespoke `mhpBuffPlus` hacks per `!` row.

## Work

1. **Document the split** in plugin or editor-facing terms: tier stats in `Enemy` data; visibility / difficulty spike from **states** (and optionally traits), not from drifting formulas between adjacent ids.

2. **New extension (new plugin or ext under the passive-state owner):** a **notetag** (or tag family) on **enemy** (and possibly **troops** / spawn metadata if needed) that selects **which** elite tier to apply (`strong` / `elite` / `boss`, names TBD) and allows **some amount of configuration** (e.g. multiplier override, stack policy, level-scaling flag — exact schema to design at implementation time).

3. **Spawn path:** ensure ABS / map enemy creation applies the state when the tag is present (order of operations vs `mhpBuffPlus` / `Game_Battler` param reads must match how J-Resources or J-ABS resolve effective max HP).

4. **Follow-up in data:** migrate existing `!` rows so **base params + growth** match their tier template; remove redundant linear HP hacks where the state now carries the punch-up.

## Notes

- Coordinate with **UI** anything that shows “database” max HP vs effective max HP after states.
- Related hygiene: `JsonEx` / save compatibility if any custom battler state is serialized (usually standard `RPG_State` ids are fine).
