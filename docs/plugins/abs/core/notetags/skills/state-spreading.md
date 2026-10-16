---
type: notetag
title: State Spreading
description: The tags letting a tracked state spread to nearby battlers on its own cadence.
tags: [abs, tag, state, spread]
---

# State Spreading

## Description

Tracked combat states can spread to nearby battlers on a cadence independent of slip/regen. Buffs and debuffs both
qualify; spreading is not limited to negative states.

Spread uses the original source battler from when the state was first applied (`JABS_State#source`).

## TAG USAGE

- States, on the state row only.

## TAG FORMAT

`<spread:[CHANCE, RANGE]>`
CHANCE = percent (1–100) rolled independently per candidate each spread pulse.
RANGE = tile distance (same as AI proximity helpers).

Optional tags (state row only):

`<viral>`
Candidates are all battlers in range, not only same-side allies.

`<spreadTick:FRAME_COUNT>`
Frames between spread pulses (default: plugin param, usually 30).

`<spreadPerTick:N>`
Max successful spreads per pulse (failed rolls do not count).

`<spreadPreferUnafflicted>`
Try battlers without this state id first (closest-first within each group).

`<spreadSkipAfflicted>`
Never spread to battlers who already have this state id (no spread refresh).

## TAG EXAMPLES

`<spread:[25, 3]>`
A 25 percent chance rolled independently per candidate each spread pulse, at a tile distance of 3.

`<spreadTick:60>`
60 frames between spread pulses.

`<spreadPerTick:2>`
Max 2 successful spreads per pulse (failed rolls do not count).