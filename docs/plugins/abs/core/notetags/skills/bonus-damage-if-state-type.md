---
type: notetag
title: Bonus Damage If State Type
description: The tag adding bonus damage while the target has any active state of a given type.
tags: [abs, tag, damage, state, type]
---

# Bonus Damage If State Type

## Description

Adds PCT% bonus damage if the target currently has at least one active state carrying the given type classifier (see
the `<type:CLASSIFIER>` notetag on states). Multiple tags for different types each contribute independently. Having
more than one matching state of the same type does not add the bonus more than once — this tag is a presence check,
not a count.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, including passives.
- Enemies

## TAG FORMAT

`<bonusDamageIfStateType:[TYPE, PCT]>`
Where TYPE is the classifier string to check for (matched case-insensitively).
Where PCT is the integer percent bonus to add when any matching state is present.

## TAG EXAMPLES

`<bonusDamageIfStateType:[poison, 25]>`
Venom mastery — +25% damage if the target has any "poison"-typed state. If the target has two different poison-typed
states active simultaneously, typePresenceBonusPct is still only 25 (presence, not count).