---
status: open
area: pixel/ext/abs
---

# Per-Enemy Hitbox Sizing (J-ABS-Pixelistics)

## Severity

**Low** (feature); incorrect radius → unfair hits.

## Gain

**Medium-high** for combat readability when paired with J-Pixelistics; scoped to `pixel/ext/abs` + enemy notes.

## Summary

Allow individual enemies to define a custom collision radius via a notetag,
enabling smaller hitboxes for nimble enemies and larger ones for bosses,
without affecting the player or untagged enemies.

## Design

1. Add a notetag (e.g., `<pixelRadius:0.45>`) parsed from the enemy's database
   entry by `RPGManager` in `J-ABS-Pixelistics` (ext/abs layer).
2. Override `Game_Event.prototype.getCollisionRadius` in `ext/abs` to read the
   JABS battler's underlying enemy notetag and return it when present, falling
   back to the base `0.3` for untagged enemies.
3. `getEffectiveRadius()` already enforces `pivotY + radius < 1.0`, which is
   correct for single-tile enemies. For large enemies (radius > ~0.30 with the
   current `pivotY = 0.70` override), the clamp ceiling must be raised.
   Options:
   - Large enemies do not override `getCollisionPivotY` (keep base `0.5`),
     giving a safe ceiling of ~0.49.
   - Or reformulate the clamp to allow the hitbox to extend up to N full tiles
     below the pivot (e.g., `Math.min(radius, 2.0 - pivotY - eps)` for a
     two-tile max extent).

## Prerequisites

- `getCollisionRadius()` / `getEffectiveRadius()` exist on `Game_CharacterBase`
  (done).
- `RPGManager` notetag parsing is available for enemy database entries.

## Notes

- Keep the notetag optional; untagged enemies use the default radius.
- This is purely an ext/abs concern — the core pixel plugin needs no changes.
- Seam-crossing checks and `isOverlappingSolidTiles` already handle multi-tile
  AABB overlap correctly, so large radii work without deeper engine changes
  once the clamp ceiling is adjusted.
