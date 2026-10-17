---
type: notetag
title: Inner Radius
description: The tag carving a dead zone out of the middle of a skill's hitbox, around the action's origin.
tags: [abs, tag, skill, hitbox, range]
---

# Inner Radius

## Description

Excludes targets within VAL tiles of the action's origin from colliding at all, regardless of hitbox shape -- a
universal dead zone carved out of the middle of whatever shape the skill uses (a donut CIRCLE, an ARC with a bite taken
out of its own pivot, etc). Applies uniformly to every hitbox type.

The exclusion is measured from the target's center point, not its full hitbox -- a target is excluded only once its
center crosses inside VAL tiles of the origin, matching how the outer shape checks already treat a target as "in range"
the moment any part of it qualifies.

## NOTE ABOUT RING WIDTH

Keep (RADIUS - VAL) at least 0.5 tiles. This engine's targeting precision bottoms out around half a tile elsewhere (see
PROXIMITY and DIRECT skill targeting); a thinner ring than that asks the player to land inside a band too narrow to
reliably hit in real-time play, even though the collision math itself is correct at any width.

## TAG USAGE

- Skills

## TAG FORMAT

`<innerRadius:VAL>`
Where VAL is the dead zone radius, in tiles. Supports decimals.

## TAG EXAMPLES

`<innerRadius:1.5>`
This skill's dead zone radius is 1.5 tiles.