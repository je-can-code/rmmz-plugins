---
type: notetag
title: Bonus Damage per State Type
description: The tag adding bonus damage for every active state of a given type on the target.
tags: [abs, tag, damage, state, type]
---

# Bonus Damage per State Type

## Description

Adds PCT% bonus damage for every distinct active state on the target that carries the given type classifier. Unlike
PER-DEBUFF BONUS, this tag is scoped to a single named type per tag rather than counting all negative states; multiple
tags for different types each contribute independently.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, including passives.
- Enemies

## TAG FORMAT

`<bonusDamagePerStateType:[TYPE, PCT]>`
Where TYPE is the classifier string to check for (matched case-insensitively).
Where PCT is the integer percent bonus to add per matching active state.

## TAG EXAMPLES

`<bonusDamagePerStateType:[poison, 10]>`
Venom mastery — +10% damage per "poison"-typed state active on the target. If the target has two different
poison-typed states active simultaneously, typeCountBonusPct from this tag = 10 * 2 = 20%.