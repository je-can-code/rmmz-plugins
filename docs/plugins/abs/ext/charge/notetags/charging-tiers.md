---
type: notetag
title: Charging Tiers
description: The tag defining the tiers a skill can be charged through, and the skill each tier releases.
tags: [abs-charge, tag, skill, charge, tier]
---

# Charging Tiers

## Description

Have you ever wanted your player to be able to "charge" skills? Well now you can! By applying the appropriate tags to
skills, you can allow the player to hold down a skill slot's input to "charge" up the skill!

## NOTE ABOUT CHARGE TIER NUANCES

To understand some of the nuances, do be sure to read the [section](../overview.md#more-about-charge-tiers) that
describes in greater detail how the charging tiers work.

## NOTE ABOUT DEFAULTS

The two optional tags in the tag format below can be made uniform by instead adjusting the configuration in the
[plugin parameters](../overview.md#plugin-parameters).

## TAG USAGE

- Skills

## TAG FORMAT

`<chargeTier:[TIER,DURATION,RELEASED_SKILL,CHARGE_ANIM?,DONE_ANIM?]>`
Where TIER represents the number of charge tier this defines.
Where DURATION is how long in frames the button must be held to charge.
Where RELEASED_SKILL is the skill to execute when released after charging.
Where CHARGE_ANIM? is the animation to play while charging (optional).
Where DONE_ANIM? is the animation to play when done charging (optional).

## TAG EXAMPLES

`<chargeTier:[1,30,175]>`
The player can charge this skill up 1 tier by holding down the input for this skill slot for 30 frames. When fully
charged and released, it will execute the skill of id 175.

`<chargeTier:[1,30,175,10]>`
The player can charge this skill up 1 tier by holding down the input for this skill slot for 30 frames. While
charging, the animation of id 10 will play on loop. When fully charged and released, it will execute the skill of id
175.

`<chargeTier:[1,30,175,10,25]>`
The player can charge this skill up 1 tier by holding down the input for this skill slot for 30 frames. While
charging, the animation of id 10 will play on loop. Each tier completed will play the animation of id 25. When fully
charged and released, it will execute the skill of id 175.

`<chargeTier:[1,60,0]>`
`<chargeTier:[2,120,90]>`
The player can charge this skill up 2 tiers by holding down the input for this skill slot. The first tier requires the
input held for 60 frames, but will yield no skill when released. The second tier requires the input held for an
additional 120 frames, and when fully charged and released, it will execute the skill id of 90.

`<chargeTier:[1,60,125]>`
`<chargeTier:[2,300,0]>`
`<chargeTier:[7,150,90]>`
(this is probably an unrealistic example, but illustrates the functionality)
The player can charge this skill up 7 tiers by holding down the input for this skill slot. The first tier requires
the input held for 60 frames, and will execute skill of id 125 when released after charging for at minimum the 60
frames. The second tier requires the input to be held for an additional 300 frames (! roughly five seconds !), and
when released after charging, will execute the same skill as tier 1 because tier 2 has 0 set as the skill id to
execute. The tiers of (3/4/5/6) are all auto-generated and each require 30 frames of holding the input. Finally, tier
7 requires the input to be held for another 150 frames, and when fully charged and released will execute skill id 90
instead. This skill requires a total of: 60 + 300 + 30 + 30 + 30 + 30 + 150 = 630 aka ~10.5 seconds of holding the
input down to fully charge all the tiers!