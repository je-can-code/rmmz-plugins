---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.2.0
  - An ally that has stopped getting closer to its formation slot now stands still instead of stepping back and forth
    across the same half tile.
### 1.1.2
  - Simplified how the pixel battler resolves its angle and idle state.
### 1.1.1
  - Dodge distance scaling moved onto J-ABS's determineDodgeStepCount seam. On the step setter it also caught the
    per-step countdown, re-scaling what remained on every step so the count climbed away from the zero the dodge waits
    for.
### 1.1.0
  - Forced displacement - knockback, pull-forward, gap-close - is now clamped by the same collision predicate the
    character's own movement obeys. J-ABS clamps it on the tile grid, which under pixel movement reads a tile the body
    is not standing in, and could park a battler inside terrain that then refused every way out.
### 1.0.8
  - Corrected PLUGIN_NAME from J-ABS-Pixelistics to J-Pixel-ABS, matching the name the ship has always been built and
    shipped under. The old spelling also read as an extension of J-ABS rather than of J-Pixelistics, which is the
    opposite of what this ship is.
### 1.0.7
  - Overrode JABS_Battler#canDirectionalDodgeStepPass to gate directional dodge steps through PIXEL's own subcell
    passability (canPassDiagonalByDirection/canPassStraight) instead of the base tile-grid check.
  - Added Game_CharacterBase#hasCustomPixelHitbox/getPixelAbsBattlerAabbModel default stubs (false/null), replacing
    duck-typing checks against optional methods with a real base contract.
### 1.0.6
  - Added enemy `hitboxReveal` support for proximity-based hitbox outlines in `J-ABS-Pixelistics`.
  - Added an always-active outline option and a default reveal-range plugin parameter.
### 1.0.5
  - Added unified enemy `hitboxSize` support across PIXEL movement, JABS battler collision, and battler hitbox overlays.
  - `event > enemy > default` precedence now applies to enemy hitbox sizing.
  - Added default enemy hitbox width/height plugin parameters.
### 1.0.4
  - `angleToDirection` folds atan2 vs `dir8ToAngle` degrees into one sector map so keyboard north and analog aim agree.
### 1.0.3
  - `JABS_AiManager` and `JABS_Battler` integration for defensive dodge with pixel movement and formation rules.
### 1.0.2
  - While strafe (direction fix) is active on the leader, projectile base direction follows sprite facing instead of
    movement vector — avoids firing opposite the drawn facing.
### 1.0.1
  - Leader projectile aim uses vector / analog input (8-dir) so diagonals match movement.
  - Sprites stay 4-dir; load order remains J-Base → J-ABS → J-Pixelistics → this plugin.
### 1.0.0
  - Initial release as the JABS integration layer for J-Pixelistics.
  - Pixel-aware idle wander state machine: idle enemies pick a random passable destination within the configured wander
    radius, walk to it, wait 2–5 seconds, then repeat. idleWanderRadius plugin parameter (default 1.5 tiles).
  - Stuck detection: abandons unreachable destinations after 1.5s.
  - Dodge step count scaled by subcell density so dodge distance matches the intended tile distance.
  - Collision table rebuilt when an enemy is defeated.
  - Smart pixel-aware movement for ally formation, retreating, and returning to home point.
  - While the party leader is in pivot guard (one input: lock in place, guard when eligible), player map movement and
    dash reassert are disabled.