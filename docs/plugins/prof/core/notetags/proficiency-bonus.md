---
type: notetag
title: Proficiency Bonus
description: The tag giving a battler bonus proficiency for any skill used.
tags: [prof, tag, bonus, flat]
---

# Proficiency Bonus

## Description

Have you ever wanted a battler to be able to gain some bonus proficiency by means of something from the database? Well
now you can! By applying the appropriate tag to the various database locations, you too can have your battlers gain
bonus proficiency!

## NOTE ABOUT FLAT BONUSES

Bonuses are flat bonuses that get added to the base amount, not percentage.

## NOTE ABOUT ENEMIES

Actors only. Enemies track their own skill proficiencies same as actors do, but the bonus-gain wiring this tag feeds
into was only ever built for actors, so a `<proficiencyBonus>` tag on an enemy (or an enemy-applicable source) is inert-
parsed by nothing, applied by nothing.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- States

## TAG FORMAT

`<proficiencyBonus:NUM>`

## TAG EXAMPLES

`<proficiencyBonus:3>`
The attacker now gains +3 bonus proficiency for any skill used.

`<proficiencyBonus:50>`
The attacker now gains +50 bonus proficiency for any skill used.