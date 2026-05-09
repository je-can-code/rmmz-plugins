---
status: open
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

## Notes

- This was triggered by juice work: weapon swing overlays feel right when centered near torso/hand, but hitbox visuals
  currently spawn from feet-origin.
