---
type: notetag
title: Stack Count
description: The tag scaling how many stacks of one passive state a source contributes.
tags: [passive-conditional, tag, passive, stack, count]
---

# Stack Count

## Description

`passiveStateCount` is the stack contribution for one state id from this source.

Kinds: `negativeStateCount`, `alliesNearby` (excludes self), `enemiesNearby`, `enemiesTargetingMe` (not
proximity-scoped- see [Gate Tags](gate-tags.md)), `lessIsMoreHp`/`Mp`/`Tp`, `moreIsMoreHp`/`Mp`/`Tp`,
`per-{registryKey}` (integer points per stack).

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<passiveStateCount:[STATE_ID, KIND, PARAM]>`
Where STATE_ID is the one state id from this source whose stack contribution this sets,
Where KIND is one of the kinds above,
Where PARAM is that kind's value (integer points per stack for `per-{registryKey}`).

## TAG EXAMPLES

`<passiveStateCount:[70, enemiesTargetingMe, 1]>`
State 70 gains 1 stack per enemy currently targeting this battler- pair with a state carrying a flat `pdr`/`mdr`
param-rate trait so each stack chips away at incoming damage.