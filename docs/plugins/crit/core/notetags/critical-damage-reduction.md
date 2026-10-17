---
type: notetag
title: Critical Damage Reduction
description: The tags reducing the amount of damage received when an enemy battler lands a critical hit.
tags: [crit, tag, damage, reduction, ctr]
---

# Critical Damage Reduction

## Description

Have you ever regreted adding a ton of critical damage multipliers across the various database locations and now need to
counterbalance that somehow? Well now you can! By applying the appropriate tag in various database locations, you can
now reduce the amount of damage received when an enemy battler lands a critical hit!

## NOTE ABOUT BASE DAMAGE

This reduces the amount of CRITICAL damage, and does not actually impact the base damage that the critical hit is based
on. See the [overview details](../overview.md) for more information.

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
- Enemies
- States

## TAG FORMAT

`<critReductionBase:NUM>`
`<critReduction:NUM>`
Where NUM is the amount to add to the battler's critical damage reduction.

## TAG EXAMPLES

`<critReduction:30>`
Reduces critical damage against this battler by 30%.

`<critReduction:10>`
`<critReduction:30>`
`<critReduction:80>`
The three amounts above total to above 100. This means that this battler will NOT take any bonus damage from critical
hits. All critical hits will be the same as non-critical hits. However, for the sake of other possible effects, the
attack will still be classified as a "critical hit".

`<critReduction:-10>`
NUM may be negative. This lowers the battler's critical damage reduction by 10%, so critical hits against them land
harder- a debuff, not a defense.