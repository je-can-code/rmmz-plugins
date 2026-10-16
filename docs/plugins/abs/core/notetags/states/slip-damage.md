---
type: notetag
title: Slip Damage
description: The tags defining how a state diminishes or replenishes HP, MP or TP on every tick.
tags: [abs, tag, state, slip, regen]
---

# Slip Damage

## Description

"Slip damage" is an alternative name for damage over time. There are three types: flat, percent, and formula-based. VAL
is applied in full on every tick -- there is no per-tick division. A tick's length is governed by the tick interval (see
[Tick Speed](tick-speed.md)), so the authored VAL is effectively "this much per tick", and the actual
per-second/per-duration total depends entirely on how fast this battler's ticks are resolving. This is intentional:
speeding up ticks (via `tickSpeed` tags) is what makes a slip effect hit harder over time, since the same VAL just lands
more often.

Battlers have three parameter pools: HP, MP, and TP. Slip tags can diminish or replenish any of them.

### Negative Slip Damage

To diminish a pool over time (poison, exhaustion, etc.): Use negative VAL values.

### Positive Slip Damage

To replenish a pool over time (regen, meditation, etc.): Use positive VAL values.

### Percent

Eats a portion of the battler's max value per tick. Use with care!

### Formula

Allows damage that scales with battler stats.

Formula context: "a" is the battler who applied the state (the source), "b" is the battler afflicted by the state (the
one ticking), "v" is variables, and "s" is the state object itself. If the state was applied to oneself
(self-inflicted), a and b are the same battler.

## NOTE ABOUT SIGN

Write this formula the same way you would a normal damage formula, where a positive result means "harm". The engine
negates the formula's output internally before adding it to the slip total, so a positive formula result becomes a loss
and a negative formula result becomes a gain -- this is the opposite convention from FLAT and PERCENT above, where
positive VAL is explicitly a gain.

## TAG USAGE

- States

## TAG FORMAT

`<hpFlat:VAL>`
`<mpFlat:VAL>`
`<tpFlat:VAL>`
Where VAL is the flat amount to gain or lose, applied in full every tick.

`<hpPercent:VAL>`
`<mpPercent:VAL>`
`<tpPercent:VAL>`
Where VAL is the % of max value to gain or lose, applied in full every tick.

`<hpFormula:[FORMULA]>`
`<mpFormula:[FORMULA]>`
`<tpFormula:[FORMULA]>`
Where FORMULA is a damage-like formula to calculate VAL, applied in full every tick.

## TAG EXAMPLES

`<hpFlat:-100>`
Lose 100 HP on every tick this state is active.

`<mpPercent:50>`
Gain 50% max MP on every tick this state is active.

`<tpFormula:[-(a.atk * 2)]>`
Gain TP equal to 200% of the source's ATK on every tick (negative formula result = gain, per the sign note above).

`<hpFormula:[(a.mat * 3)]>`
Lose HP equal to 300% of the source's MAT on every tick (positive formula result = harm, just like a damage formula).