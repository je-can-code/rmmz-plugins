---
type: notetag
title: This Range Size Modifiers
description: The tags modifying one skill's reach, read from that skill's own note.
tags: [abs, tag, skill, range, radius, proximity, thickness]
---

# This Range Size Modifiers

## Description

Self-scoped counterparts to `<rangeBuff>`/`<rangeRate>`/`<radiusBuff>`/`<radiusRate>`/`<proximityBuff>`/
`<proximityRate>`/`<thicknessBuff>`/`<thicknessRate>`: the same "shared axis (all three dimensions) vs per-axis" split,
and the same additive-rate accumulator (`finalRate = 1.0 + sum(rate - 1.0)` across every applicable tag, caster-wide and
this-scoped combined), but read only from the acting skill's own note instead of every note source on the caster. They
stack additively with the caster-wide versions rather than replacing them, the same "this"-tag pattern as
`<thisCastTimeDamageBonus>`.

## TAG USAGE

- Skills, read from the skill's own note, never the caster's.
- Items, read from the item's own note, never the caster's.

## TAG FORMAT

`<thisRangeBuff:N>`
Where N is a signed decimal tile count (e.g. 1.5, -0.5).

`<thisRangeRate:N>`
Where N is a non-negative decimal multiplier (1.0 = no change).

`<thisRadiusBuff:N>`
Where N is a signed decimal tile count.

`<thisRadiusRate:N>`
Where N is a non-negative decimal multiplier (1.0 = no change).

`<thisProximityBuff:N>`
Where N is a signed decimal tile count.

`<thisProximityRate:N>`
Where N is a non-negative decimal multiplier (1.0 = no change).

`<thisThicknessBuff:N>`
Where N is a signed decimal tile count.

`<thisThicknessRate:N>`
Where N is a non-negative decimal multiplier (1.0 = no change).

## TAG EXAMPLES

`<proximity:2>`
`<thisRangeBuff:2>`
This skill alone reaches 2 extra tiles of targeting proximity (and radius/thickness, if tagged), on top of whatever
`<rangeBuff>` the caster carries from equipment/passives/etc.