---
type: notetag
title: Forcing On-Crit Procs
description: The tag forcing every chance roll a critical hit carries to succeed, without touching crit chance or luck.
tags: [crit, tag, state, on-crit, luck]
---

# Forcing On-Crit Procs

## Description

Have you ever wanted a critical hit to land every on-chance effect it carries, every single time, without having to
touch your Accumulate/Encore/luck systems to get there? Well now you can! Applying this tag to the attacker's own note
sources forces every chance roll a critical hit makes to succeed, as if the attacker had rolled a guaranteed positive
result: the `thisCrit`/`onCrit` states from [On-Crit State Application](on-crit-state-application.md), and every other
chance-based state the critting hit puts on the battler it crit or takes off it.

## NOTE ABOUT SCOPE

On a critical hit, this forces:

```
1. The on-crit states: thisCritApply, thisCritSelf, onCritApply and onCritSelf.
2. The skill's own Add State and Remove State effects on the battler it crit.
3. J-SkillExtend's on-hit tags on that hit: applyState, thisApplyState, applyStateWhenAfflicted,
   thisApplyStateWhenAfflicted, onHitSelfState, onHitLoseState, onHitStripState and onHitRemoveState, plus
   onCastStripState and onCastRemoveState on that battler.
```

It does not change whether the hit itself crits, and it never forces a hit that did not crit. It does not touch the
attacker's real `isVeryLucky()` or `isVeryCursed()` flags anywhere else- Accumulate Mode and Encore both still read the
attacker's real values and stack normally on top of this.

## NOTE ABOUT THE FORCED ROLL

A forced roll lands whatever its chance comes to, including a chance the recipient's State Rate traits and
`<stateTypeResist>` bring down to 0%. Each landing still adds the state the way any other does, so the recipient's
immunities are checked on every one of them.

In Accumulate Mode, a forced roll lands once for every chance the roll brings: its one chance, the attacker's lucky
rolls, and the target's curses when the state is aimed at the target as harm. Encore then repeats every landing.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<forceCritProcs>`

## TAG EXAMPLES

`<forceCritProcs>`
Any battler with this tag applied to one of their note sources will always succeed the chance rolls their critical hits
make- a mastery capstone state with this tag turns an `onCritApply:[5, 25]` (25% chance), or a skill's 25% Add State
effect, into an application on every critical hit against any target that is not immune to state id 5, without
inflating crit chance itself or touching luck elsewhere.