---
type: notetag
title: Cast Speed
description: The tags modifying how long a battler's casts take, with base, flat and rate formulas.
tags: [abs-timing, tag, casting, formula, battler]
---

# Cast Speed

## Description

Have you ever wanted skills to have a base cast speed, but maybe when a battler has a particular state applied or
equipment equipped, they now have even faster cast times (or slower???)? Well now you can! By applying the appropriate
tag to various database locations, you can control how fast (or slow) a battler's cast times are!

## NOTE ABOUT BUILDING THE TAGS

By constructing tags using the format described below, you are given access to a "Formula" box that behaves similar to
a "Formula" box that defines the damage of a skill. None of the tags are case sensitive, but the order is specific. If
you find yourself having trouble building the tags, you can peek at the source code of this file and search for
`J.ABS.EXT.TIMING.RegExp =` to find the grand master list of all combinations of tags. Do note that the hard brackets
of `[]` are required to wrap the formula in the note tag.

## NOTE ABOUT FASTER AND SLOWER CASTING

If you want faster casting, the formula should result in a NEGATIVE value. If you want slower casting, the formula
should result in a POSITIVE value.

## NOTE ABOUT THE MINIMUM CAST TIME

The minimum amount of time for casting is 0 frames.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<baseCastTime:[FORMULA]>`
`<castTimeFlat:[FORMULA]>`
`<castSpeedRate:[FORMULA]>`
Where [FORMULA] is the formula to produce the cast speed value.

## TAG EXAMPLES

`<baseCastTime:[3]>`
Base cast speed will be set to +3 frames.

`<castTimeFlat:[(a.level * 2) * -1]>`
All cast times are reduced by 2 frames per level.

`<castSpeedRate:[b * -5]>`
All cast times will be reduced by 5% per point of base casting speed.
(not a practical formula, but demonstrating use)