---
type: notetag
title: Auto-Inflict State
description: The tag applying a real combat state onto whoever its bearer just inflicted a state upon or knocked back.
tags: [passive-conditional, tag, state, trigger, inflict]
---

# Auto-Inflict State

## Description

Unlike [`autoApplyState`](auto-apply-state.md) (applies to the rule bearer) and its
[OnNearby sibling](auto-apply-state-on-nearby.md) (applies to proximity), this fires from an event involving an
external battler- the rule bearer doing something to someone else- and applies STATE_ID onto that same someone else.
The bearer's own state tracking credits the bearer as the inflictor of STATE_ID, matching who really did it.

### Conditions

- `negaStateInflicted` — this battler inflicts a [`<type:negative>`](../../../../abs/core/notetags/states/negative.md)
  (`isNegativeType`) state on someone
- `posiStateInflicted` — this battler inflicts a non-negative state on someone
- `anyStateInflicted` — this battler inflicts any state on someone
- `onKnockback` — this battler knocks an enemy back (`JABS_Engine#checkKnockback`)

## NOTE ABOUT THE DEPTH GUARD

Depth-guarded ([`auto-inflict-state-max-depth`](../parameters/auto-inflict-state-max-depth.md)) in case STATE_ID is
itself negative-tagged and would otherwise re-trigger this same tag on application.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<autoInflictState:[STATE_ID, CONDITION, COOLDOWN_FRAMES]>`
Where STATE_ID is the state applied onto that someone else,
Where CONDITION is one of the conditions above,
Where COOLDOWN_FRAMES is the minimum frames between dispatches for this rule; 0 means every time.

## TAG EXAMPLES

`<autoInflictState:[70, negaStateInflicted, 0]>`
`<autoInflictState:[71, posiStateInflicted, 60]>`
`<autoInflictState:[72, anyStateInflicted, 0]>`
`<autoInflictState:[73, onKnockback, 0]>`