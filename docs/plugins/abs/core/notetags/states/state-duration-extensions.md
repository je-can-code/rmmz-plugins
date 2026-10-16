---
type: notetag
title: State Duration Extensions
description: The tags modifying the outgoing duration of states applied by a battler.
tags: [abs, tag, state, duration]
---

# State Duration Extensions

## Description

Tags that modify the outgoing duration of states applied by a battler.

### Formula

Formula context: `a` = the assailant applying the state (whose notes are being summed), `b` = the base duration in
frames before any boosts, `v` = `$gameVariables._data`.

## NOTE ABOUT OUTGOING DURATION

These affect outgoing state duration only. They do not shorten or extend how long incoming states last on this battler.

## NOTE ABOUT MULTIPLE TAGS

Multiple tags are summed from all applicable sources.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills, known by the battler.

## TAG FORMAT

`<stateDurationFlat: VAL>`
Where VAL is the flat number of frames to add (can be negative).

`<stateDurationPerc: VAL>`
Where VAL is the % of base duration to add (can be negative).

`<stateDurationFormula:[FORMULA]>`
Where FORMULA calculates bonus frames to add to the base duration.

## TAG EXAMPLES

`<stateDurationFlat: 120>`
Adds 120 frames to the duration of every state this battler applies.

`<stateDurationPerc: 50>`
Adds 50% of base duration to every state this battler applies.

`<stateDurationFormula:[a.luk * 2]>`
Adds bonus frames to every state this battler applies, scaled off their own LUK.