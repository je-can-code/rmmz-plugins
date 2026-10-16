---
type: notetag
title: This State Duration Extensions
description: The tags modifying the outgoing duration of one state, read from that state's own note.
tags: [abs, tag, state, duration]
---

# This State Duration Extensions

## Description

A state-scoped counterpart to `<stateDurationFlat/Perc/Formula>`: those apply to every state a battler applies (summed
from every note source on the caster), which is too broad when you only want to boost states sharing a classifier.
`thisStateDurationFlat/Perc/Formula` are read only from the state's own note, but that note can be someone else's: when
another active state carries `<extend:[STATE_ID]>` or `<extendType:TYPE>` targeting this state, `J-Extend` merges the
overlay's note into this state's resolved note before this boost is read, so one passive state (e.g. an
equipment-granted passive) can extend the duration of one specific state, or of every state sharing a `<type:TYPE>`
classifier, without editing the target state(s) directly. This is the same "this"-scoped riding-along pattern as
`<thisStackMaxBoost>`, applied to duration instead of stack cap.

The boost applies when this state's own outgoing map-timer duration is resolved.

### Formula

Formula context: `b` = the base duration in frames before any boosts. No battler context (`a`) is available, since this
boost is state-scoped rather than caster-scoped.

## TAG USAGE

- States, read from a single state's own note, never the caster directly.

## TAG FORMAT

`<thisStateDurationFlat:VAL>`
Where VAL is the flat number of frames to add (can be negative).

`<thisStateDurationPerc:VAL>`
Where VAL is the % of base duration to add (can be negative).

`<thisStateDurationFormula:[FORMULA]>`
Where FORMULA calculates bonus frames to add to the base duration.

## TAG EXAMPLES

`<extendType:low-effort>`
`<thisStateDurationPerc:100>`
Placed on a passive state (e.g. granted by J-Passive's equipment-granted-state tags). While this passive is active,
every currently active state carrying `<type:low-effort>` has its outgoing map duration doubled; other states this
battler applies (or that don't carry the `low-effort` classifier) are untouched.