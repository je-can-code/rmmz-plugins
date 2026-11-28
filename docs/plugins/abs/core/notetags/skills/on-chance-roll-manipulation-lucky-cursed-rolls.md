---
type: notetag
title: On-Chance Roll Manipulation (Lucky/Cursed Rolls)
description: The tags handing a battler good or bad fate on on-chance rolls, or bypassing the roll entirely.
tags: [abs, tag, on-chance, luck, curse, formula]
---

# On-Chance Roll Manipulation (Lucky/Cursed Rolls)

## Description

Nearly every on-chance roll in JABS (hit, crit, state application and removal, parry, glance, and skill procs) is a
"best of N": the roller gets one chance plus any extra chances and succeeds if any of them lands, then has to pass
every extra hurdle as well. These tags hand out those chances and hurdles as a battler's fate.

Formula context: `a` = the battler being evaluated, `b` = 0, `v` = `$gameVariables._data`.

### Lucky Rolls

Battler-wide good fate, summed from all note sources. Each lucky roll is one more chance on this battler's own rolls:
landing a hit, applying a state, scoring a crit, proccing a bonus-hit or retaliate check, parrying or glancing a hit.

### This Lucky Rolls

Skill-scoped variant. Adds on top of the battler-wide total, but only while this specific skill is executing. A roll
made without a skill in hand reads the battler-wide total alone.

### Cursed Rolls

Battler-wide bad fate, summed from all note sources. Each cursed roll weighs on this battler from every side:

- its own rolls have to pass one more hurdle, procs included;
- harm aimed at it gets one more chance to land: hits, crits, ailments, blessings stripped from it, and the parries and
  glances of anyone it swings at;
- help aimed at it has to pass one more hurdle: heals, buffs and cleanses.

A battler aiming at itself counts its curse once, as the roller.

An action aimed at its user's opponents is harm, and anything else it aims is help. When no action aims the roll, as
with an aura, a state spreading, a state applied as another expires, or a state an evasion applies, the state itself
decides: one carrying `<type:negative>` is harm, and any other is help.

### This Cursed Rolls

Skill-scoped variant, layered on top of the battler-wide total while its caster uses this skill: the skill's own rolls
have to pass more hurdles, and anyone it swings at gets more chances to parry or glance it.

### Very Lucky / Very Cursed

Boolean bypass flags rather than reroll counts.
These short-circuit the roll contest entirely instead of adding more dice to it.

## NOTE ABOUT STACKING BOTH FLAGS

`veryLucky`/`veryCursed` are checked before any reroll math runs, so a battler with both tags present resolves to
whichever the engine checks first (lucky wins ties) -- avoid stacking both on the same battler.

## NOTE ABOUT ACCUMULATE MODE

A roller in Accumulate Mode counts every chance that lands instead of stopping at the first, so each curse on the
target of an ailment is one more chance for that ailment to land again.

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
Where FORMULA resolves to the number of extra chances to grant.

`<thisLuckyRolls:[FORMULA]>`

`<cursedRolls:[FORMULA]>`
Where FORMULA resolves to the number of curses to lay on the battler.

`<thisCursedRolls:[FORMULA]>`

`<veryLucky>`
This battler's on-chance rolls always succeed when it is the roller.

`<veryCursed>`
This battler's on-chance rolls always fail when it is the roller.

## TAG EXAMPLES

`<luckyRolls:[Math.floor(a.luk / 20)]>`
Grants one more chance per 20 points of this battler's own LUK.

`<thisLuckyRolls:[1]>`
Grants 1 more chance on top of the battler-wide total, but only while this skill is executing.

`<cursedRolls:[1]>`
One more hurdle on this battler's own rolls, and one more chance for anything harmful aimed at it to land.

`<thisCursedRolls:[1]>`
One more hurdle on this skill's own rolls, and one more chance to parry or glance it, on top of the battler-wide
total.

`<veryLucky>`
This battler's on-chance rolls always succeed when it is the roller.

`<veryCursed>`
This battler's on-chance rolls always fail when it is the roller.
