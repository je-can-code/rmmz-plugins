---
type: notetag
title: Critical Damage Multiplier
description: The tags controlling how hard (or weak) a battler's critical hits will be.
tags: [crit, tag, damage, multiplier, cdm]
---

# Critical Damage Multiplier

## Description

Have you ever wanted to have any amount of control over critical damage? Well now you can! By applying the appropriate
tag to various database locations, you can now control how hard (or weak) a battler's crit will be!

Four new tags are available for use across the various applicable database objects: two for base values, and two for
adding onto the base. While you can use any of the four on any of the database locations listed below, it was designed
so that the "base" tags would live on static objects, like the actor itself, while the non-base tags would live
everywhere else.

The two base values have greater impact when used in the context of `J-NaturalGrowths`, as they are a new value that can
be leveraged within the formulas you write, allowing for complex buff/growth formulas revolving around incoming/outgoing
critical hit damage.

## NOTE ABOUT MULTIPLE TAGS

If multiple tags are present on a single battler, then all tag amounts will be added together for a single multiplier
amount as seen in the examples.

## NOTE ABOUT USING J-NATURALGROWTHS

If using my `J-NaturalGrowths` plugin as well, these tags will function in a near identical fashion to the
`(cdm|cdr)(Buff)(Plus):[flat amount]` type of tags. To spare the extra unnecessary loops, it is recommended that if
using the `J-NaturalGrowths` plugin as well, then to use the suggested format provided by that plugin instead of this.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- States

## TAG FORMAT

`<critMultiplierBase:NUM>`
`<critMultiplier:NUM>`
Where NUM is the amount to add to the battler's critical damage multiplier.

## TAG EXAMPLES

`<critMultiplier:50>`
Increases the outgoing critical damage multiplier by 50% for this battler.

`<critMultiplier:10>`
`<critMultiplier:40>`
`<critMultiplier:150>`
Increases the outgoing critical damage multiplier by 200% for this battler.