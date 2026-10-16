---
type: notetag
title: Knockback
description: The tags configuring how far a skill knocks its target back, and whether terrain can halt it.
tags: [abs, tag, skill, knockback, terrain]
---

# Knockback

## Description

How many tiles the target is knocked back when hit by this skill.

### Ignore Terrain

By default, forced displacement (knockback, pull, etc.) walks the target tile-by-tile toward the destination and stops
early at the last passable tile if terrain blocks the rest of the way. With this tag, the target instead jumps straight
to the computed destination, sailing over pits, gaps, or anything else that would normally halt the walk.

## TAG USAGE

- Skills

## TAG FORMAT

`<knockback:VAL>`
Where VAL is the distance the target will be knocked back.

`<ignoreTerrain>`

## TAG EXAMPLES

`<knockback:2>`
The target will be knocked back 2 tiles.

`<ignoreTerrain>`
The target jumps straight to the computed destination, sailing over anything that would normally halt the walk.