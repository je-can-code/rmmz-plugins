---
status: open
area: code-quality
---

# Dedicated audit: `checkForBooleanFromNoteByRegex` and negatively named tags

## Severity

**High** when wrong. Inverted boolean logic on tags like “hide” / “disable” / “block” without `nullIfEmpty: true` (or equivalent) causes **silent opposite behavior** in shipped games.

## Gain

**Very high** once executed. This is the formal backlog counterpart to the workspace rule: do not fix opportunistically in unrelated PRs; sweep deliberately with tests or a checklist per database type.

## Source

`checkForBooleanFromNoteByRegex` appears in (non-exhaustive grep snapshot):

- `src/plugins/_base/managers/RPGManager.js` (definitions)
- `src/plugins/abs/core/database/RPG_Enemy.js` (heavy usage)
- `src/plugins/abs/core/database/RPG_Skill.js`, `RPG_State.js`, `RPG_Item.js`, `RPG_UsableItem.js`
- `src/plugins/abs/core/objects/Game_Actor.js`
- `src/plugins/sks/database/RPG_Skill.js`
- `src/plugins/abs/ext/tools/database/RPG_Skill.js`
- `src/plugins/omni/ext/monster/database/RPG_Enemy.js`
- `src/plugins/jafting/ext/refine/database/RPG_EquipItem.js`
- `src/plugins/jafting/ext/refine/__models/JAFT_RefinementData.js`
- `src/plugins/abs/core/__models/JABS_OnChanceEffect.js`
- `src/plugins/abs/ext/hitstop/_models/JABS_Action.js`
- `src/plugins/abs/ext/shield/_models/JABS_Shield.js`
- `src/plugins/level/objects/Game_Enemy.js`
- `src/plugins/abs/ext/danger/objects/Game_Enemy.js`
- `src/plugins/crit/objects/Game_Action.js`
- `src/plugins/hud/ext/target/objects/Game_Enemy.js`
- `src/plugins/abs/core/sprites/Spriteset_Map.js`

## Context

RPGManager’s boolean note helpers encode conventions about empty string vs missing tag. Negatively phrased property names interact badly with default truthiness. A single mistaken call site is hard to spot in review.

## Work

1. Export or document the **intended contract** for `checkForBooleanFromNoteByRegex` (and siblings) in J-Base JSDoc.
2. Spreadsheet or script: each call site → tag regex → property name → `nullIfEmpty` value → expected designer meaning.
3. Fix mismatches in a dedicated PR series (possibly split by plugin family).
4. Add Vitest coverage for RPGManager helpers where fixtures already exist (`test/plugins/_base/`).

## Notes

- Explicitly called out in workspace “Known Future Work”; this file tracks it in `.backlog`.
