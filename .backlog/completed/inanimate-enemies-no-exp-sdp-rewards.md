---
status: done
area: bug
---

# Inanimate enemies (trees, shrubs, deposits) should not grant EXP or SDP

## Symptom

Destructible map objects (grass, shrubs, trees, ore deposits, crates, walls) are implemented as enemies in the database with levels that control their tankiness. The flat EXP system (`ExperienceManager`) awards EXP purely based on **level difference** — it does not distinguish between a living enemy and a piece of lumber. A level 10 `*Shrub (Oak)` gives 250 EXP to a level 5 player (the +5 slot in the lookup table). A level 60 `*Tree (Negapine)` can award up to 1000 EXP (a full level) to anyone 45+ levels below it.

SDP points from the flat EXP system's level-difference calculation are similarly affected — chopping trees is an unintended SDP farm.

The base `exp` on these enemies is already 0, and they have no `sdpPoints` or `sdpPlus` notetags — but the level-difference bonus from the flat EXP extension and the SDP JABS integration bypass those values entirely.

## Affected enemies

All inanimate enemies are tagged with `<jabsConfig:inanimate>` and use name prefixes `*` (harvestable), `@` (tool target), or are destructible objects. IDs 1–51 in `Enemies.json` cover the current set (grass, shrubs, trees, deposits, walls, crates, dummies, etc.).

## Root cause

### EXP path (flat EXP extension)

`src/plugins/level/ext/flat/managers/JABS_Engine.js` — `determineExperienceGained` calls `ExperienceManager.calculateRewardFromLevelDifference(actorLevel, enemyLevel)` unconditionally. It never checks whether the defeated enemy is inanimate.

### SDP path

`src/plugins/sdp/core/managers/JABS_Engine.js` — `determineSdpGained` calls `defeatedEnemy.sdpPoints()`. While the base sdpPoints is 0 for inanimates, the level-scaling multiplier (`getRewardScalingMultiplier`) could still interact. Verify this path is also safe, or add the same guard.

## Fix

Check for the `inanimate` JABS config on the defeated enemy before calculating level-difference rewards. Both EXP and SDP paths should bail early and return 0 for inanimate targets.

The `<jabsConfig:inanimate>` tag is already present on every affected enemy — no data changes needed, only code.

```
// Pseudocode for the EXP path:
JABS_Engine.prototype.determineExperienceGained = function(defeatedEnemy, victoriousActor)
{
  // inanimate objects don't grant experience.
  if (defeatedEnemy is inanimate) return 0;

  // ... existing level-difference calculation ...
};
```

## Design intent (why levels stay high)

Inanimate enemy levels control **combat difficulty** (HP, DEF scaling via Level Master and NaturalGrowths notetags). A level 60 Negapine is intentionally beefy — you need endgame stats to chop it efficiently. This is a progression gate on resource access and should be preserved. The fix is to exclude inanimates from the **reward** pipeline, not to change their levels.

## Validation

- Chop a `*Shrub (Oak)` (lv10) at any player level → 0 EXP, 0 SDP
- Chop a `*Tree (Negapine)` (lv60) → 0 EXP, 0 SDP
- Mine a `*Deposit (Iron)` (lv10) → 0 EXP, 0 SDP
- Kill a regular Ghosty (lv1) → still awards EXP and SDP normally
- Inanimate objects still drop their loot (materials, items) as before