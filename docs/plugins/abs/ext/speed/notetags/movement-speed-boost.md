---
type: notetag
title: Movement Speed Boost
description: The tag making a battler move faster or slower on the map, as a percent of its base movespeed.
tags: [abs-speed, tag, movement, speed, battler]
---

# Movement Speed Boost

## Description

Have you ever wanted to have your battlers on the map move a little bit slower or faster when afflicted with haste or
wearing heavy boots, etc? Well now you can! By applying the appropriate tag to various database locations, you can
control how fast or slow the battler's movement speed is while on the map.

## NOTE ABOUT STACKING

Multiple tags across multiple objects on a single battler will stack additively.

## NOTE ABOUT LIMITS

There is no upper limit of move speed, so be careful!
There is a(n arbitrary) lower limit, of -90% move speed multiplier.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<speedBoost:NUM>`
Where NUM is the positive/negative percent modifier against base movespeed.

## TAG EXAMPLES

`<speedBoost:40>`
This battler's movement speed will be increased by ~40%.

`<speedBoost:-26>`
This battler's movement speed will be decreased by ~26%.

`<speedBoost:11>`
This battler's movement speed will be increased by ~11%.

`<speedBoost:70>`
`<speedBoost:-50>`
`<speedBoost:-10>`
`<speedBoost:30>`
This battler's movement speed will be increased by ~40%.