---
type: notetag
title: Shield Bonus Damage
description: The tag adding bonus damage that a skill deals to shields.
tags: [abs-shield, tag, skill, shield, damage, formula]
---

# Shield Bonus Damage

## Description

Have you ever wanted to be able to deal bonus damage to all those pesky shields that the enemy has on them? Well now
you can! By applying the appropriate tags to skills, you too can create skills that are shield destroyers!

## TAG USAGE

- Skills

## TAG FORMAT

`<shieldDamage:[FORMULA]>`
Where FORMULA represents a damage-like formula calculating the amount of bonus damage to deal. The variables `a`, `b`,
and `o` can be used in the formulas like you would in a damage formula, where `a` represents the attacker executing the
skill, `b` represents target with the shield, and `o` represents the pre-shielded amount of damage.

## TAG EXAMPLES

`<shieldDamage:[100]>`
A skill with this tag will deal a flat 100 bonus damage to shields.

`<shieldDamage:[o * 3]>`
A skill with this tag will deal triple the original damage to shields.

`<shieldDamage:[b.currentShieldValue() / 2]>`
A skill with this tag will deal half of the current shield value as bonus damage to shields.

`<shieldDamage:[a.hp + ($gameParty.gold() * 100)]>`
A skill with this tag will deal the amount equal to the attacker's current hp plus 100 times the party's gold.
(a bizarre formula, but demonstrating availability to globals)