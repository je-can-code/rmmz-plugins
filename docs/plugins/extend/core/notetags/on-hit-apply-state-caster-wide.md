---
type: notetag
title: On-Hit Apply State (Caster-Wide)
description: The tag making every hit a battler lands apply a state, with an authored chance, duration and stacks.
tags: [extend, tag, state, on-hit, duration, stacks, passive]
---

# On-Hit Apply State (Caster-Wide)

## Description

Have you ever wanted a passive state, equipped item, or actor data to make your attacks apply a state with custom
duration or stacks on every hit? Well now you can! The caster-wide variant reads from all of the attacker's notes, so it
can live anywhere — a poisoned-blade state, a cursed accessory, or a base actor trait — and will fire whenever that
battler lands a hit.

## NOTE ABOUT CHANCE, DURATION AND STACKS

All notes from the [skill-scoped section](on-hit-apply-state-skill-scoped.md) apply here as well (CHANCE, DURATION,
STACKS behavior, resistances, etc.).

## NOTE ABOUT BOTH VARIANTS

If both `<applyState>` and [`<thisApplyState>`](on-hit-apply-state-skill-scoped.md) target the same state id on the
same hit, `<thisApplyState>` fires last and wins.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<applyState:[STATE_ID, CHANCE]>`
`<applyState:[STATE_ID, CHANCE, DURATION]>`
`<applyState:[STATE_ID, CHANCE, DURATION, STACKS]>`
Where STATE_ID is the id of the state to apply to the target.
Where CHANCE is the percent chance between 0 and 100 that it triggers.
Where DURATION is the duration in frames; omit or use 0 for the state's default, or -1 to force the application
indefinite regardless of the state's own tags.
Where STACKS is the starting stack count; omit to use the state's default.

## TAG EXAMPLES

`<applyState:[12, 100, 600]>`
On every hit, always apply state id 12 for 600 frames (10 seconds at 60fps).

`<applyState:[12, 30]>`
On every hit, 30% chance to apply state id 12 with the state's default duration.

`<applyState:[12, 30, 0, 3]>`
On every hit, 30% chance to apply state id 12 with 3 starting stacks and the state's own default duration (0 = no
duration change).

`<applyState:[12, 30, -1]>`
On every hit, 30% chance to apply state id 12 forever, regardless of the state's own duration tags.