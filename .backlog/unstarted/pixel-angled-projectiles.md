---
status: open
area: pixel/ext/abs
---

# Angled Projectiles (J-ABS-Pixelistics Phase F)

## Summary

Extend JABS projectiles to travel at arbitrary angles when `J-Pixelistics` is active,
enabling skills to fire at e.g. 74 degrees rather than only the 8 cardinal/diagonal directions.

## Design

1. Add an optional `_projectileAngle` field (number, degrees) to `JABS_ActionOptions`.
2. Extend `JABS_ActionOptionsBuilder` with `.setProjectileAngle(degrees)`.
3. In `src/plugins/pixel/ext/abs`, add an override of the action event's `updateMove` (or
   `JABS_Action.mainUpdate`) that, when `_projectileAngle` is set, calls
   `actionSprite.vectorMoveByAngle(_projectileAngle)` instead of following the built-in move route.
4. Bypass the standard "move straight" route repeat for angled actions.
5. The action duration/expiration logic remains unchanged (frame-based).

## Prerequisites

- J-Pixelistics `vectorMoveByAngle` method exists on `Game_CharacterBase` (done as of Phase E).
- J-ABS `JABS_ActionOptions` extensibility pattern is already in place.

## Notes

- This is a non-trivial JABS core extension; it should be a dedicated PR.
- The angle field is optional: if not set, actions behave as before (cardinal directions).
- Sprite rotation for angled projectiles (to show an arrow pointing at 74°) requires a
  separate sprite layer or a custom `Sprite_Character` override — that is additional scope.
