---
status: open
area: pixel/ext/abs
---

# Angled projectiles (true vector / degree-based firing)

## Severity

**Medium** (new movement path; edge cases in collision and cleanup).

## Gain

**High** for action feel; non-trivial integration with `JABS_Action` / routes — dedicated PR as noted.

## Summary

Extend JABS projectiles to travel at arbitrary angles when `J-Pixelistics` is active,
enabling skills to fire at e.g. 74 degrees rather than only the 8 cardinal/diagonal directions.

## Current status

- **Dir8 aiming** is done (leader vector input → dir8) and considered “good enough” for most skills.
  See: `completed/pixel-8dir-projectile-aim.md`.
- **Angle plumbing hook exists**: `JABS_ActionOptions` already carries `projectileTravelAngleDegrees` and the builder
  supports `.setProjectileTravelAngleDegrees(degrees)`. This is intentionally unused for motion today.

## Design (MVP)

1. **Angle source**: Decide how an action gets an angle:
   - Party leader: reuse `Game_Player#getVectorInputAngle()` (already implemented).
   - AI/battlers: derive from target vector or keep snapping to dir8 unless explicitly enabled.
2. **Store**: Use `JABS_ActionOptions#projectileTravelAngleDegrees` as the authoritative travel bearing.
3. **Motion path**: When an action has a non-null travel angle, bypass route stepping and instead integrate motion each
   update tick using pixel movement (`vectorMoveByAngle(angle)` or a direct `realX/realY` delta).
4. **Collision policy**: Keep existing hit detection, but ensure the action’s map position advances along the angle so
   collisions match visuals. (Hitbox rotation / oriented shapes is optional extra scope; start with position-driven hits.)
5. **Sprite policy**: Prefer “single row (down) + rotate” FX sheets for true-angle actions; multi-row `$` sheets still
   need row snapping and will not visually represent sub-45° bearings without rotation.

## Prerequisites

- J-Pixelistics `vectorMoveByAngle` method exists on `Game_CharacterBase` (done as of Phase E).
- J-ABS `JABS_ActionOptions` extensibility pattern is already in place.

## Notes

- This is a non-trivial movement/collision extension; it should be a dedicated PR.
- The angle field is optional: if not set, actions behave as before (dir8 route-driven projectiles).
- There is already an internal naming convention: `projectileTravelAngleDegrees` (degrees, RMMZ angle space).
