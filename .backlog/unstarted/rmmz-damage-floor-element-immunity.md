---
status: open
area: combat
---

# RMMZ damage floor bypasses element immunity

## Severity

**Low** — cosmetic/feel issue; player takes 1 damage when they should take 0.

## Gain

**Low effort, high correctness** — single override to `makeDamageValue` or equivalent; makes element immunity actually feel like immunity.

## Source

RMMZ core clamps all damage to a minimum of 1 via `Math.max(1, value)` inside `makeDamageValue`. This fires after element rate is applied, so even a 0% element rate (full immunity via stacked traits) still deals 1 damage per hit.

Surfaced during `slime-puddle` mastery playtest — Elemental Osmosis capstone at 4 stacks resolves to 0% elemental rate but player still receives 1 damage from elemental hits.

## Work

Override `Game_Action.prototype.makeDamageValue` (or the final damage step) to skip the floor-of-1 when element rate resolves to 0 for the relevant element. Absorption (negative element rate) is already handled separately by J.ELEM and should not be affected.
