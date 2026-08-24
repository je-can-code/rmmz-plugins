# 8-dir projectile aim + vis tag defaults for action templates

## Outcome

JABS action/projectile direction supports **8-direction** aim under Pixelistics (leader vector input), while retaining
RMMZ's **4-row sprite sheet** constraints for action event graphics.

## Shipped concepts

- **Aim source**: Party leader uses analog/vector input angle when available; others fall back to map facing.
- **Strafe compatibility**: When direction fix (strafe) is active, projectile base direction follows the locked facing.
- **Sprite rows**: Action event `direction()` remains cardinal for bitmap row selection (`$` sheets), while the action
  itself can retain diagonal travel intent.
- **Visual tags**: Action-map template Comment `<vis*>` tags are stamped once at spawn into a synthetic note holder on
  `JABS_Action`, then merged with skill notes (skill overrides duplicates).

## Source

- `src/plugins/pixel/ext/abs/objects/JABS_Battler.js` (leader vector aim + strafe behavior)
- `src/plugins/abs/core/managers/JABS_Engine.js` (spawn-time stamp + sprite facing rules)
- `src/plugins/abs/core/__models/JABS_Action.js` (synthetic note holder for template comments)
- `src/plugins/abs/core/database/RPG_Skill.js` (merged `<vis*>` reads)
- `src/plugins/abs/core/sprites/Sprite_Character.js` (merged visual application)

## Notes

This work intentionally stops at **dir8**. True arbitrary-degree travel requires a dedicated motion path and collision
policy (see `unstarted/pixel-angled-projectiles.md`).
