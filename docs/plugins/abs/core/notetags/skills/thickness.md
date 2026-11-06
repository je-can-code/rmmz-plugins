---
type: notetag
title: Thickness
description: The tag defining how wide a LINE or the arms of a CROSS are, or how deep a WALL is.
tags: [abs, tag, skill, hitbox, line, wall, cross]
---

# Thickness

## Description

Sets the size of a hitbox along its narrow axis, in tiles. Defaults to 1 when omitted.

For a LINE hitbox, this is the full width of the line. For a CROSS hitbox, it is the full width of both arms. For a WALL
hitbox, it is how far the wall reaches forward from the action.

## NOTE ABOUT HITBOX TYPES

This tag only affects LINE, CROSS and WALL hitboxes.

## TAG USAGE

- Skills, with a LINE, CROSS or WALL hitbox.

## TAG FORMAT

`<thickness:VAL>`
Where VAL is the width in tiles.

## TAG EXAMPLES

`<thickness:2>`
This skill's line hitbox is 2 tiles wide.