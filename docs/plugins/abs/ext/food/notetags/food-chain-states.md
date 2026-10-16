---
type: notetag
title: Food Chain States
description: The tag marking a state as one phase of a food group's chain arc.
tags: [abs-food, tag, state, food, chain]
---

# Food Chain States

## Description

Tag every state that belongs to a food arc with the group name.

## NOTE ABOUT CHAIN PROGRESSION

Chain progression is authored entirely via
[`<applyStateOnExpire>`](../../../core/notetags/skills/apply-state-on-expire.md) (`J-ABS` core). The Well Fed entry
state expires into the peak, the peak expires into the tail, and the tail has no expire link (natural end of chain).

## NOTE ABOUT DURATION

Required for arcs longer than ~2.8 minutes: use `J-ABS` core `<stateDuration:FRAMES>` on each phase state (see
[`J-ABS`'s state durations](../../../core/notetags/states/state-durations.md)). Chef Adventure targets:
`ca/docs/food/food-chain-durations.md`

## TAG USAGE

- States

## TAG FORMAT

`<foodChain:TYPE>`
Where TYPE is a lower-case string (protein, vegetable, fruit, grain, dairy, confection, etc.). All states in one arc
share TYPE.

## TAG EXAMPLES

Example three-phase Protein chain:

`<foodChain:protein>`
`<applyStateOnExpire:[PUMPED_ID, 100]>`
State "Well Fed (Protein)".

`<foodChain:protein>`
`<applyStateOnExpire:[HANGRY_ID, 100]>`
State "Pumped".

`<foodChain:protein>`
State "Hangry" (no expire link — chain ends).