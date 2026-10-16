---
type: notetag
title: Proximity
description: The tag defining the maximum tile distance between the battler and the target at which a skill can be used.
tags: [abs, tag, skill, range, targeting, ai]
---

# Proximity

## Description

Defines the maximum tile distance between the battler and the target at which the skill can be used. This tag serves two
purposes:

1. AI GATE: An AI-controlled battler will not attempt this skill unless they are within VAL tiles of their current
   target.

2. DIRECT SKILL RANGE: For skills that also carry `<direct>`, proximity defines the search radius for target selection
   at decision time. The engine will only lock onto targets within this distance. All direct skills must have this tag
   -- it is not optional.

## NOTE ABOUT ZERO PROXIMITY

`<proximity:0>` means zero range, not uncapped. A value of 0 will never match any target.

## TAG USAGE

- Skills

## TAG FORMAT

`<proximity:VAL>`
Where VAL is the proximity value (in tiles) for this skill.

## TAG EXAMPLES

`<proximity:5>`
This skill can be used when the target is within 5 tiles.