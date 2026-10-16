---
type: notetag
title: Vis Offset
description: The tags shifting a skill's action sprite by a pixel offset, optionally per direction of travel.
tags: [abs, tag, skill, visual, sprite, offset]
---

# Vis Offset

## Description

Shifts the action sprite by a fixed pixel offset relative to the center of the action event.

### Directional Offsets

Apply a different pixel offset depending on the direction the action is traveling. Useful when a sprite looks
off-center in some directions.

## NOTE ABOUT PRECEDENCE

Directional offsets take precedence over `<visOffset>` when a direction-specific tag is present.

## TAG USAGE

- Skills

## TAG FORMAT

`<visOffset:[X,Y]>`
Where X is the horizontal offset in pixels (positive = right).
Where Y is the vertical offset in pixels (positive = down).

`<visOffsetU:[X,Y]>`   (facing up)
`<visOffsetD:[X,Y]>`   (facing down)
`<visOffsetL:[X,Y]>`   (facing left)
`<visOffsetR:[X,Y]>`   (facing right)
`<visOffsetUR:[X,Y]>`  (diagonal: up-right)
`<visOffsetUL:[X,Y]>`  (diagonal: up-left)
`<visOffsetDR:[X,Y]>`  (diagonal: down-right)
`<visOffsetDL:[X,Y]>`  (diagonal: down-left)

## TAG EXAMPLES

`<visOffset:[6,12]>`
Shifts the action sprite 6 pixels right and 12 pixels down.

`<visOffsetL:[-6,0]>`
While facing left, shifts the action sprite 6 pixels left.