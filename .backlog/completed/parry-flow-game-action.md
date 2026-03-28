---
status: done
area: completed
---

# Parry flow cleanup in `Game_Action`

## Source

- `src/plugins/abs/core/objects/Game_Action.js` (`handleGuardEffects`, `processParry`, `onParry`)
- `src/plugins/abs/core/_metadata/initialization.js` (`ParryCharacterAnimationId`)
- Plugin parameter group **GUARD / PARRY VISUALS** in `_annotations.js`

## Done

Parry flow was already split into dedicated methods. The map animation id is no longer hard-coded: `J.ABS.Metadata.ParryCharacterAnimationId` (plugin param `parryCharacterAnimationId`, default `122`). Use `0` to skip the character animation on parry.
