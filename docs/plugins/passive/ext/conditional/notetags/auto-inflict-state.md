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
- `onKnockback` — one of this battler's hits actually moves an enemy, knocked back or pulled in by
  `<pullForward>` (`JABS_Engine#onKnockback`). A hit that leaves the enemy where it stood fires nothing, a hop in place
  included

## NOTE ABOUT THE APPLICATION ROLL

STATE_ID is rolled for at a full 100% chance, through the same
[application roll](../../../../abs/core/notetags/states/state-application-immunity-resistance.md) as any other state
that lands by chance, with the bearer as the roller:

- the chance is scaled by the target's State Rate traits and `<stateTypeResist>`, and, when STATE_ID is
  `<type:negative>`, by the luck between the bearer and the target;
- the bearer's
  [lucky and cursed rolls](../../../../abs/core/notetags/skills/on-chance-roll-manipulation-lucky-cursed-rolls.md) go
  into the roll, and the target's curse weighs on it by STATE_ID's own polarity, whatever set the rule off: a
  `<type:negative>` STATE_ID is harm, so each curse is one more chance for it to land, and any other is help, so each
  curse is one more hurdle for it to clear;
- the bearer's [Accumulate Mode](../../../../abs/core/notetags/skills/accumulate-mode.md) and
  [Encore Repeats](../../../../abs/core/notetags/skills/encore-repeats-bonus-proc-executions.md) can land it more than
  once.

A target that cannot take STATE_ID at all, through an immunity or because it holds STATE_ID as a passive, is never
rolled for, and every landing checks the target's immunities on its own.

## NOTE ABOUT THE DEPTH GUARD

Depth-guarded ([`auto-inflict-state-max-depth`](../parameters/auto-inflict-state-max-depth.md)) in case STATE_ID is
itself negative-tagged and would otherwise re-trigger this same tag on application. The guard covers every landing of
one roll, and a firing it refuses is never rolled for.

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
Where STATE_ID is the state rolled for on that someone else,
Where CONDITION is one of the conditions above,
Where COOLDOWN_FRAMES is the minimum frames between rolls for this rule; 0 means every time. It starts over every time
STATE_ID is rolled for, whether or not it landed; a target unable to take STATE_ID leaves it where it was.

## TAG EXAMPLES

`<autoInflictState:[70, negaStateInflicted, 0]>`
`<autoInflictState:[71, posiStateInflicted, 60]>`
`<autoInflictState:[72, anyStateInflicted, 0]>`
`<autoInflictState:[73, onKnockback, 0]>`