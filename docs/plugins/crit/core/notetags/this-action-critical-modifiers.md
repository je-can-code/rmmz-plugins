---
type: notetag
title: This Action Critical Modifiers
description: The tags modifying the critical chance and critical damage of a specific skill or item's execution.
tags: [crit, tag, skill, item, chance, formula]
---

# This Action Critical Modifiers

## Description

Have you ever wanted to modify the current action's critical chance and/or modifier? Well now you can! By applying the
appropriate tag to the database objects in question, you can control the critical chance and critical damage modifiers
for a specific skill's execution!

Formula context: `a` = this action's subject (the attacker), `b` = 0 (unused; present for formula consistency), `v` =
`$gameVariables._data`.

## NOTE ABOUT STACKING

This stacks additively with other crit effects.

## NOTE ABOUT SKILLS THAT CANNOT CRIT

The effects of these tags do not apply to skills that cannot crit, so be sure to make certain the critical dropdown is
set to "YES" in the damage formula box for the given skill.

## TAG USAGE

- Items
- Skills

## TAG FORMAT

`<thisCritChance:[FORMULA]>`
`<thisCritMultiplier:[FORMULA]>`
`<thisCritsAlways>`

## TAG EXAMPLES

`<thisCritChance:[25]>`
Increases the critical chance of this particular skill by 25%.

`<thisCritMultiplier:[10 + a.agi]>`
Increases the critical damage multiplier by 10% plus the battler's agility.

`<thisCritsAlways>`
The skill or item with this tag will ALWAYS crit.