---
type: notetag
title: Remove State On Move
description: The tag stripping a state's stacks the instant its bearer moves, the pair to a stand-built stack.
tags: [passive-conditional, tag, state, stack, movement]
---

# Remove State On Move

## Description

The instant the bearer moves on the map, unconditionally peels one stack from STATE_ID (or all stacks at once if that
state row has [`loseAllStacksAtOnce`](../../../../abs/core/notetags/states/stack-config-overrides.md) set). No chance
roll, no stype filter- this fires every single time the bearer moves, full stop.

## NOTE ABOUT PAIRING WITH STAND

Tag lives on the state doing the peeling- typically the SAME state also carries an
[`autoApplyState`](auto-apply-state.md) "stand" rule for the very state id it removes, since this pairing is what makes
a "charge up while standing still, lose it the moment you move" mechanic work: standing still builds the stack, moving
strips it instantly, and the stand cooldown is reset to a full interval the moment you move again so the buildup can't
restart instantly either.

## TAG USAGE

- States only.

## TAG FORMAT

`<removeStateOnMove:[STATE_ID]>`
Where STATE_ID is the state to peel a stack from.

## TAG EXAMPLES

`<autoApplyState:[80, stand, 60]>`
`<removeStateOnMove:[80]>`
On this same state row: standing still for 60 frames applies a stack of state 80. Taking even a single step
immediately strips it and resets the stand timer.