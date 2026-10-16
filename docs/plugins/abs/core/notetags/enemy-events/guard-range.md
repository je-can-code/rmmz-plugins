---
type: notetag
title: Guard Range
description: The tag defining the distance at which a guardian can respond to attacks on its wards.
tags: [abs, tag, enemy, event, ai, guardian]
---

# Guard Range

## Description

By default, a guardian's engagement range when protecting a ward is the largest pursuit radius of any ward currently
nearby. You can override this with an explicit range tag.

Use this when you want a guardian that sits at a distance but swoops in the moment its ward is touched, even from across
the room.

## NOTE ABOUT GUARDIAN MODE

`guardRange` only applies while the guardian is in guardian mode. Without this tag, the fallback is the max ward pursuit
radius, which may be smaller than you want if your wards are close-range fighters.

## TAG USAGE

- Event comments, on an enemy event.
- Enemies, as a default for that enemy.

## TAG FORMAT

`<guardRange:RADIUS>`
Where RADIUS is the tile distance at which the guardian can respond to ward attacks and stay engaged after engaging.

## TAG EXAMPLES

`<guardRange:8>`
This guardian can respond to ward attacks and stay engaged from up to 8 tiles away.