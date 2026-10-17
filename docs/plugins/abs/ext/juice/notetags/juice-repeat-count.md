---
type: notetag
title: Juice Repeat Count
description: The tag setting how many times a skill's juice motion repeats within its duration.
tags: [abs-juice, tag, skill, motion, overlay]
---

# Juice Repeat Count

## Description

Number of times to repeat the motion within the juice duration (default 1).

- For `spin` / `spin-reverse`: full rotations.
- For `arc-oscillate`: number of arc sweeps, alternating direction.
- For all other motions: full replays within the duration window.

## TAG USAGE

- Skills

## TAG FORMAT

`<juiceRepeatCount:N>`
Where N is the number of times to repeat the motion.

## TAG EXAMPLES

`<juiceRepeatCount:3>`
This skill's motion repeats 3 times within the juice duration.