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

Spread uses the original source battler from when the state was first applied (`JABS_State#source`), and the skill it
applied the state with.

## NOTE ABOUT THE ROLL

Each candidate is rolled for on its own, the way every state application is rolled, as
[State-Application Immunity & Resistance](../states/state-application-immunity-resistance.md) describes. The original
source rolls CHANCE against the candidate: the candidate's State Rate traits and `<stateTypeResist>` weigh on the
chance, and the LUK the source holds over the candidate shapes what remains. The source brings its own lucky and cursed
rolls, joined by the skill's own `<thisLuckyRolls>` and `<thisCursedRolls>` when a skill applied the state.

No action aims a spread, so the state itself decides how the candidate's curse weighs on the roll: a state carrying
`<type:negative>` gets one more chance to land for each curse the candidate carries, and any other state has to clear
each of them, as [On-Chance Roll Manipulation](on-chance-roll-manipulation-lucky-cursed-rolls.md) describes. Accumulate
Mode and Encore can land the state on one candidate more than once. A battler the state cannot be added to, such as one
immune to it, is never a candidate.

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
Max battlers the spread lands on per pulse. A battler counts once however many times the state lands on it, and a
battler it misses does not count.

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
The spread lands on at most 2 battlers per pulse; a battler it misses does not count.