---
type: notetag
title: Tick Speed
description: The tags modifying how often slip and regen effects tick.
tags: [abs, tag, state, slip, regen, tick]
---

# Tick Speed

## Description

Slip/regen effects don't tick every frame -- they tick on an interval (the "Default State Tick Interval" plugin
parameter as the base for state slips, a separate configurable interval for natural HP/MP/TP regen). Because slip VAL is
applied in full every tick (see [Slip Damage](slip-damage.md)), making ticks fire more often is what makes a slip effect
deal more total damage over time -- there is no rescaling to compensate. These tags are battler-wide modifiers against
that interval, summed from every note source on the battler (actor, class, weapons, armors, states).

Both flat and percent modifiers apply together: the flat offset is added to the base interval first, then the combined
percent divides the result. The final interval is floored at a small minimum (the plugin's "Minimum State Tick Interval"
parameter, never below 1 frame) so ticks can never be reduced to zero or negative frames.

### Per-State Tick Speed Override

Independent of the modifiers above, an individual state can declare its own fixed tick interval rather than using the
shared base interval.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, also the only place `<thisTickSpeed:FRAMES>` goes.

## TAG FORMAT

`<tickSpeedFlat:VAL>`
Where VAL is a flat number of frames added to (or, if negative, subtracted from) the base tick interval. Positive VAL =
slower ticks (longer wait between them); negative VAL = faster ticks.

`<tickSpeedPercent:VAL>`
Where VAL is a percent applied against the interval as a divisor: `interval / (1 + VAL / 100)`. Positive VAL = faster
ticks (shorter interval); negative VAL = slower ticks. Note this is the OPPOSITE sign convention from `tickSpeedFlat`
above -- a positive flat value slows ticks down, but a positive percent value speeds them up.

`<tickSpeedTypePercent:[TYPE, VAL]>`
A percent modifier scoped to a single `<type:TYPE>` classifier (the same classifier family used by
`<stateTypeResist>`/`<stateTypeImmune>` in
[State-Application Immunity & Resistance](state-application-immunity-resistance.md)) rather than applying universally.
Only contributes when the state or regen source actually carries a matching `<type:TYPE>` tag. Same sign convention as
`tickSpeedPercent` (positive = faster).

`<thisTickSpeed:FRAMES>`
Where FRAMES is this state's own tick interval, ignoring the plugin parameter default entirely. The flat/percent
modifiers above still apply on top of this override the same way they would the default.

## TAG EXAMPLES

`<tickSpeedFlat:30>`
This source adds 30 frames to the base tick interval, for slower ticks.

`<tickSpeedPercent:100>`
This source doubles this battler's slip/regen tick frequency (ticks twice as often).

`<tickSpeedTypePercent:[poison, 50]>`
This source ticks poison-typed states 50% faster, but has no effect on any other state.

`<thisTickSpeed:30>`
This state's own tick interval is 30 frames, ignoring the plugin parameter default entirely.