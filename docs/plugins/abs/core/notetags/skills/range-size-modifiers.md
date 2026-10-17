---
type: notetag
title: Range Size Modifiers
description: The tags scaling the effective reach of every JABS action launched by the bearer.
tags: [abs, tag, range, radius, proximity, thickness]
---

# Range Size Modifiers

## Description

These tags scale the effective reach of every JABS action launched by the bearer. They apply to three dimensions
simultaneously:

```text
radius    — the hitbox extent used for circle/rhombus/square/line/wall/cross
proximity — how close a direct-target skill must be to its target to fire
thickness — the perpendicular width of LINE and WALL hitboxes
```

Read from `getAllNotes()` on the caster (passives, equips, states, class, actor, etc.). Tags on the skill itself work
too but will affect ALL of the bearer's outgoing actions, not just that skill.

Both buff and rate are optional; if neither is present the base value is used unchanged. Modifiers are skipped entirely
when the skill has no explicit tag for that dimension (e.g. a skill with no `<proximity:N>` is not affected by
`rangeBuff`/`rangeRate` on the proximity axis).

### Stacking Formula (shared, per-axis, and combined)

```text
finalValue = max(0, (base + sharedBuff + axisBuff) * (sharedRate + axisRateDelta))
```

Where sharedBuff = sum of every `<rangeBuff:N>`, axisBuff = sum of every axis-specific buff, sharedRate accumulates as:
1.0 + sum(each rangeRate - 1.0), and axisRateDelta = sum(each axis-specific rate - 1.0) added on top.

```text
<rangeRate:1.5> alone → 1.5x
<rangeRate:1.5> + <rangeRate:1.5> → 2.0x  (each contributes +0.5)
<rangeRate:1.5> + <radiusRate:1.2> on radius → (1.0 + 0.5 + 0.2) = 1.7x
<rangeRate:0.8> → 0.8x  (contributes -0.2, acts as a range penalty)
```

### Range Buff (flat additive, applied before rate — affects ALL dimensions)

Adds N tiles to the base value before the rate multiplier is applied. Negative values reduce reach (range penalty).

### Range Rate (multiplicative, base-1.0 delta model — affects ALL dimensions)

Multiplies the buffed value. The tag value IS the rate, not the delta; each tag contributes (N - 1.0) to the rate
accumulator so that stacking multiple rates behaves additively rather than compounding exponentially.

### Radius Buff (flat additive, radius only — stacks with `rangeBuff`)

Adds N tiles to the radius (AoE splash zone) only; does not affect proximity or thickness.

### Radius Rate (multiplicative, radius only — stacks with `rangeRate`)

Adds (N - 1.0) to the rate accumulator for radius only.

### Proximity Buff (flat additive, proximity only — stacks with `rangeBuff`)

Adds N tiles to proximity (targeting reach) only; does not affect radius or thickness.

### Proximity Rate (multiplicative, proximity only — stacks with `rangeRate`)

Adds (N - 1.0) to the rate accumulator for proximity only.

### Thickness Buff (flat additive, thickness only — stacks with `rangeBuff`)

Adds N tiles to thickness (LINE/WALL hitbox width) only; does not affect radius or proximity.

### Thickness Rate (multiplicative, thickness only — stacks with `rangeRate`)

Adds (N - 1.0) to the rate accumulator for thickness only.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, including passives.
- Enemies
- Skills, though a tag on a skill will affect ALL of the bearer's outgoing actions, not just that skill.

## TAG FORMAT

`<rangeBuff:N>`
Where N is a signed decimal tile count (e.g. 1.5, -0.5).

`<rangeRate:N>`
Where N is a non-negative decimal multiplier (1.0 = no change).

`<radiusBuff:N>`
Where N is a signed decimal tile count.

`<radiusRate:N>`
Where N is a non-negative decimal multiplier (1.0 = no change).

`<proximityBuff:N>`
Where N is a signed decimal tile count.

`<proximityRate:N>`
Where N is a non-negative decimal multiplier (1.0 = no change).

`<thicknessBuff:N>`
Where N is a signed decimal tile count.

`<thicknessRate:N>`
Where N is a non-negative decimal multiplier (1.0 = no change).

## TAG EXAMPLES

`<rangeBuff:2>`
+2 tiles on every outgoing action's radius, proximity, and thickness.

`<rangeRate:1.5>`
1.5x reach on all actions (radius, proximity, and thickness).

`<radiusBuff:2>`
Hazard mastery — +2 tiles to AoE splash zone only.

`<radiusRate:1.5>`
Hazard mastery — 1.5x AoE splash zone, targeting reach unchanged.

`<proximityBuff:2>`
+2 tiles of targeting reach, splash zone unchanged.

`<proximityRate:1.5>`
1.5x targeting reach, splash zone unchanged.

`<thicknessBuff:1>`
+1 tile of LINE/WALL width, radius and proximity unchanged.

`<thicknessRate:1.5>`
1.5x LINE/WALL width, radius and proximity unchanged.