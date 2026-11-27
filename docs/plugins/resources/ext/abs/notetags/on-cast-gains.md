---
type: notetag
title: On-Cast Gains
description: The tags granting or taxing the caster HP, MP, or TP once every time it executes a skill on-map, hit or miss.
tags: [resources-abs, tag, skill, gain, on-cast]
---

# On-Cast Gains

## Description

Have you ever wanted a skill that refunds a little MP the moment it is cast, or a curse that makes every skill its
victim uses cost them a slice of their own life? Well now you can! By applying the appropriate tag(s) to a skill, or to
anything the caster carries, the caster will receive (or lose) HP, MP, or TP once every time it executes a skill.

## NOTE ABOUT TIMING

The gain lands as the skill's costs are paid: once per execution, before the skill has hit or missed anything. A skill
that misses everything still triggers it, and a skill that hits five targets still triggers it only once. A channeled
skill triggers it once, when its cost is paid upfront. Retaliations and other forced skills pay no costs, so they do not
trigger it either.

This is the difference from [On-Attack Gains](on-attack-gains.md), which fire once for every hit a skill lands.

## NOTE ABOUT NEGATIVE GAINS

A negative value takes the resource away instead. On a state, that makes a tax on every skill its bearer uses, the way
`<on-cast-hp-gain:-10%>` costs a tenth of the bearer's max HP every time it acts.

## NOTE ABOUT REC SCALING

Gains are scaled by the caster's REC stat, negative ones included.

## TAG USAGE

- Skills (only while that skill is the one being executed)
- Actors
- Classes
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

### Flat

`<on-cast-hp-gain:FLAT>`
`<on-cast-mp-gain:FLAT>`
`<on-cast-tp-gain:FLAT>`
Where FLAT is a fixed amount to restore, or take away when negative, on each execution.

### Percentage

`<on-cast-hp-gain:PERCENT%>`
`<on-cast-mp-gain:PERCENT%>`
`<on-cast-tp-gain:PERCENT%>`
Where PERCENT is a percentage of the caster's maximum for that resource.

### Formula

`<on-cast-hp-gain:[FORMULA]>`
`<on-cast-mp-gain:[FORMULA]>`
`<on-cast-tp-gain:[FORMULA]>`
Where FORMULA is an eval'd expression.
`a` = the caster battler.
`b` = flat + calculated-percent (the accumulated base before formula).

## TAG EXAMPLES

`<on-cast-mp-gain:10>`
Refunds 10 MP to the caster every time it executes this skill, whether or not it lands.

`<on-cast-hp-gain:-10%>`
On a curse state: every skill its bearer executes costs it 10% of its max HP, hit or miss.

`<on-cast-tp-gain:[a.level / 10]>`
Grants TP equal to one-tenth the caster's level on every execution.
