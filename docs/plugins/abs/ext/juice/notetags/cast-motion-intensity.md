---
type: notetag
title: Cast Motion Intensity
description: The tag setting how far a skill's cast motion deforms the caster's sprite at its peak.
tags: [abs-juice, tag, skill, motion, cast]
---

# Cast Motion Intensity

## Description

Peak deformation of the cast motion as a percent of the sprite's true size: at the bottom of a 45 squat the sprite is
45% wider and correspondingly shorter. When omitted, the juice config's
[`unarmedStrikeSquishIntensity`](../overview.md#field-reference) is used, which is tuned for a poke rather than a
workout. Only read when [`<castMotion:NAME>`](cast-motion.md) is set.

## TAG USAGE

- Skills

## TAG FORMAT

`<castMotionIntensity:PERCENT>`
Where PERCENT is the peak deformation of the cast motion as a percent of the sprite's true size.

## TAG EXAMPLES

`<castMotionIntensity:45>`
At the bottom of each squat the sprite is 45% wider and correspondingly shorter.