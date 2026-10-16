---
type: notetag
title: Boost Elements
description: The tag boosting (or penalizing) the damage a battler deals with skills of a particular element.
tags: [elem, tag, element, boost, damage]
---

# Boost Elements

## Description

Have you ever wanted a battler to temporarily (or permanently) become more effective with skills of a particular
element? Well now you can! By applying the appropriate note tag to the various database locations applicable, you can
"boost" one or more elements (more requires multiple tags) by as little or as much as your heart desires!

### Details

When a skill's elemental calculation is performed, all relevant notes will be checked to see if the the caster has any
boosts for any of the elements that a skill possesses. If there are ANY elemental boosts found, it applies to the total
damage that would've been dealt. The general use case for this tag would be to give an actor/enemy a passive bonus to a
particular element that the actor/enemy would have access to cast in some way.

### Example 1

If a skill has element id 1 on it, and the caster has a tag on it that boosts element 1 by 30%, then that skill would
deal 130% of its original damage.

### Example 2

If a skill has multiple elements 1, 2, and 3 on it, and the caster has a tag that boosts element 2 by 50% and element 3
by 50%, then the result would be the product of the two resulting in the skill dealing 225% of its original damage.

## NOTE ABOUT ABSORB, NULL AND STRICT RULES

[Absorb](absorb-elements.md) and null and [strict](strict-elements.md) rules still apply!

## TAG USAGE

- Actors
- Enemies
- Weapons
- Armor
- Skills
- States
- Classes

## TAG FORMAT

`<boostElement:[ELEMENT_ID, PERCENT_BOOST]>`
PERCENT_BOOST accepts negative numbers too, for a penalty instead of a boost.
Repeatable — one tag per boosted element.

## TAG EXAMPLES

`<boostElement:[1, 50]>`
This battler has a +50% boost to skills bearing element id 1.

`<boostElement:[1, -30]>`
This battler deals 30% LESS damage with skills bearing element id 1- useful for a curse/debuff state rather than a buff.