---
type: notetag
title: Fast Cooldown
description: The tags modifying how long a battler's cooldowns last, with base, flat and rate formulas.
tags: [abs-timing, tag, cooldown, formula, battler]
---

# Fast Cooldown

## Description

Have you ever wanted skills to have a base cooldown time, but maybe when a battler has a particular state applied or
equipment equipped, they now have even faster cooldown times (or slower???)? Well now you can! By applying the
appropriate tag to various database locations, you can control how fast (or slow) a battler's cooldown times are!

## NOTE ABOUT FORMULA VARIABLES

Considering the value is evaluated() in javascript (similar to how a skill formula box is calculated), there are also a
few letter variables available for use when building the formula:

- `a`: as seen in the example of `a.level`, refers to the battler itself.
- `b`: as seen in the example of `-1 * (b * 5)` refers to the base parameter. This defaults to 0 unless otherwise
  uncalculated.

## NOTE ABOUT BUILDING THE TAGS

By constructing tags using the format described below, you are given access to a "Formula" box that behaves similar to
a "Formula" box that defines the damage of a skill. None of the tags are case sensitive, but the order is specific. If
you find yourself having trouble building the tags, you can peek at the source code of this file and search for
`J.ABS.EXT.TIMING.RegExp =` to find the grand master list of all combinations of tags. Do note that the hard brackets
of `[]` are required to wrap the formula in the note tag.

## NOTE ABOUT FASTER AND SLOWER COOLDOWNS

If you want faster cooldowns, the formula should result in a NEGATIVE value. If you want slower cooldowns, the formula
should result in a POSITIVE value.

## NOTE ABOUT THE MINIMUM COOLDOWN

The minimum amount of time for cooldowns is 0 frames.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<baseFastCooldown:[FORMULA]>`
`<fastCooldownFlat:[FORMULA]>`
`<fastCooldownRate:[FORMULA]>`
Where [FORMULA] is the formula to produce the fast cooldown value.

## TAG EXAMPLES

`<baseFastCooldown:[3]>`
Base fast cooldown will be set to +3 frames.

`<fastCooldownFlat:[(a.level * -2)]>`
All cooldowns are reduced by 2 frames per level.

`<fastCooldownRate:[-1 * (b * 5)]>`
All cooldowns will be reduced by 5% per point of base fast cooldown.
(not a practical formula, but demonstrating use)