---
type: notetag
title: On-Chance Roll Manipulation (Lucky/Cursed Rolls)
description: The tags adding extra rolls to either side of an on-chance roll contest, or bypassing it entirely.
tags: [abs, tag, on-chance, luck, curse, formula]
---

# On-Chance Roll Manipulation (Lucky/Cursed Rolls)

## Description

Nearly every on-chance roll in JABS (hit, crit, state application, and skill procs) isn't a single roll -- it's a
"best of N" roll for the party rolling toward success and a "best of N" roll for the party rolling toward failure,
where N defaults to 1 for each side. These tags let you add extra rolls to either side of that contest.

Formula context: `a` = the battler being evaluated, `b` = 0, `v` = `$gameVariables._data`.

### Lucky Rolls

Battler-wide extra positive rerolls, summed from all note sources. This battler gets an extra roll toward success any
time IT is the one trying to succeed (landing a hit, applying a state, scoring a crit, proccing a bonus-hit or retaliate
check).

### This Lucky Rolls

Skill-scoped variant. Adds on top of the battler-wide total, but only while this specific skill is executing.

### Cursed Rolls

Battler-wide extra negative rerolls, summed from all note sources. This battler gets an extra roll toward failure any
time it is on the receiving end of a chance roll (an incoming hit trying to land, an incoming state trying to apply).

### This Cursed Rolls

Skill-scoped variant, layered on top of the battler-wide total.
Applies while the target is defending against this specific incoming skill.

### Very Lucky / Very Cursed

Boolean bypass flags rather than reroll counts.
These short-circuit the roll contest entirely instead of adding more dice to it.

## NOTE ABOUT STACKING BOTH FLAGS

`veryLucky`/`veryCursed` are checked before any reroll math runs, so a battler with both tags present resolves to
whichever the engine checks first (lucky wins ties) -- avoid stacking both on the same battler.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills; the skill-scoped `<thisLuckyRolls>` and `<thisCursedRolls>` go on skills only.

## TAG FORMAT

`<luckyRolls:[FORMULA]>`
Where FORMULA resolves to the number of bonus positive rolls to grant.

`<thisLuckyRolls:[FORMULA]>`

`<cursedRolls:[FORMULA]>`
Where FORMULA resolves to the number of bonus negative rolls to grant.

`<thisCursedRolls:[FORMULA]>`

`<veryLucky>`
This battler's on-chance rolls always succeed when it is the roller.

`<veryCursed>`
This battler's on-chance rolls always fail when it is the roller.

## TAG EXAMPLES

`<luckyRolls:[Math.floor(a.luk / 20)]>`
Grants one bonus positive roll per 20 points of this battler's own LUK.

`<thisLuckyRolls:[1]>`
Grants 1 bonus positive roll on top of the battler-wide total, but only while this skill is executing.

`<cursedRolls:[1]>`
Grants 1 bonus negative roll.

`<thisCursedRolls:[1]>`
Grants 1 bonus negative roll on top of the battler-wide total, while the target is defending against this skill.

`<veryLucky>`
This battler's on-chance rolls always succeed when it is the roller.

`<veryCursed>`
This battler's on-chance rolls always fail when it is the roller.