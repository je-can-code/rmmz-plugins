---
type: notetag
title: Gate Tags
description: The tags gating whether a source's passives are granted, by a threshold or a battlefield condition.
tags: [passive-conditional, tag, passive, gate, condition]
---

# Gate Tags

## Description

`passiveSourceRule` gates every passive from this source; `passiveStateRule` gates one state id from this source.

### Threshold kinds

Threshold kinds use `*Above` (>=) and `*Below` (<=):

- `hp`/`mp`/`tp` — current resource percent; `mhp`/`mmp`/`mtp` — flat max values
- `{registryKey}Above`/`Below` — flat or hundred-scale per `ParameterRegistry`
- `allAllies{Key}Above`/`Below` — every allied JABS battler (incl. self) must pass

### Discrete kinds

Discrete kinds include `alliesNearby`, `enemiesNearby`, `alliesNearbyBelow`, `enemiesNearbyBelow`,
`enemiesTargetingMe`, `enemiesTargetingMeBelow`, `hasState`, `negativeStateCount`, `slotOnCooldown`,
`slotOffCooldown`, `allOnCooldown`, `allOffCooldown`, `sinceLastMoved`/`Hit`/`Attacked`,
`movedWithin`/`hitWithin`/`attackedWithin` (frames).

### Nearby kinds

`alliesNearby`/`enemiesNearby` pass at COUNT or more in range (>=); the `*Below` counterparts pass under COUNT (<) —
use them for "nobody nearby" gates, e.g. `[enemiesNearbyBelow, 1, 1]` for "no enemies within melee range" (1 tile).

### Targeting kinds

`enemiesTargetingMe`/`enemiesTargetingMeBelow` work the same way but are NOT proximity-scoped- they count opposing
battlers that currently have this battler as their live AI target, regardless of tile distance. No radius param; PARAM
is just the count threshold.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<passiveSourceRule:[KIND, PARAM?]>`
Where KIND is one of the threshold or discrete kinds above,
Where PARAM is the optional value that kind takes.

`<passiveStateRule:[STATE_ID, KIND, PARAM?]>`
Where STATE_ID is the one state id from this source that the rule gates,
Where KIND and PARAM are as for `passiveSourceRule`.

## TAG EXAMPLES

`<passive:[12]>`
`<passiveStateRule:[12, hpBelow, 25]>`

`<passiveSourceRule:[allOffCooldown]>`

`<passiveSourceRule:[enemiesNearbyBelow, 1, 1]>`

`<passiveSourceRule:[enemiesTargetingMe, 1]>`
Only grants this source's passives while at least one enemy has this battler targeted.