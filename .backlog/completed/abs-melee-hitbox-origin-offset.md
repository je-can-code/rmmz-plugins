---
status: done
area: architecture
---

# Melee hitbox origin offset (collision + visuals)

## Source

- JABS hitbox construction for melee shapes (arc / line / circle), plus debug hitbox rendering.
- Context surfaced while tuning `J-ABS-Juice` weapon swing overlays (sword arcs want a torso/hand origin, not feet).

## Context

RMMZ `Game_Character` and `Sprite_Character` are naturally anchored at the feet, so any shape spawned from a battler
"position" will appear to originate from the ground.

That is fine for ground AoEs and traps, but for **melee** hitboxes (slashes, arcs, stabs) it creates a mismatch:

- **Collision math** originates from the feet/tile position.
- **Hitbox visuals** (and weapon swing overlays) feel correct when centered around the torso/weapon hand.

If we shift only the visuals, the visuals become a lie. If we force the weapon swing to match feet-origin, it looks wrong.

**Pixel movement / tile alignment:** With pixel movement enabled, the character can sit at a sub-tile offset inside a map cell,
but melee hitbox placement still tracks the **tile** the player is considered "on" (or is otherwise tile-quantized in practice).
Moving up or down within the same tile makes this obvious: the sprite shifts while the hitbox stays tied to that tile anchor,
so swings look misaligned even before worrying about feet vs torso. Whatever origin work we do should use the same **continuous**
battler position the sprite uses (and verify against Cyclone / `J-ABS-Pixelistics` coordinate paths), not a rounded tile corner only.

## Work

- Add an explicit concept of a melee "attack origin" offset that affects **both**:
  - hitbox collision math (the true shape origin).
  - hitbox debug rendering / visualization (must match collision).
- Default offsets to (0,0) so existing skills do not change behavior.
- Apply offsets only for melee-style shapes (arc/line/stab/circle as appropriate), leaving ground-targeted AoEs/traps feet-based.
- Decide where the offset lives (examples):
  - per-skill notetag (later: external JSON config), and/or
  - per-weapon-type defaults, and/or
  - global defaults with per-skill overrides.
- Acceptance:
  - A slash arc can originate from torso-height with a small forward bias and the debug visuals match the real hitbox.
  - No regressions to existing ground AoE visuals/collision.
- Audit hitbox origin inputs: ensure melee shapes use the battler’s **actual** map position under pixel movement (not only
  tile-index math), so hitboxes follow fine vertical/horizontal offsets within a tile the way the character sprite does.

## Notes

- This was triggered by juice work: weapon swing overlays feel right when centered near torso/hand, but hitbox visuals
  currently spawn from feet-origin.
- Observed in play: with pixel movement on, vertical nudging inside a tile leaves hitboxes visually locked to the tile grid
  while the actor sprite is not, which reads as the player swinging "off" their body.

## Resolution

Shipped. JABS now owns explicit melee-origin helpers such as `resolveMeleeOriginPixelOffsetsForFacing()`,
`resolveMeleeVerticalLiftPxForFacing()`, `getActionOriginPixels()`, and `getMeleeVisualOriginPixelsFromCharacter()`,
and both collision math and hitbox/debug rendering consume that shared origin path.

The configurable offset metadata landed with the engine-side origin helpers, so melee visuals and real collision now move
together instead of diverging around a feet-origin anchor.
