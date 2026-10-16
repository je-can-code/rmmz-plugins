---
type: notetag
title: Degrees
description: The tag defining the angular width of an ARC hitbox.
tags: [abs, tag, skill, hitbox, arc]
---

# Degrees

## Description

Controls the angular width of an ARC hitbox. Values from 1 to 359. If degrees is 180 or more, the arc effectively
becomes a full forward hemisphere with width equal to double the radius.

## NOTE ABOUT HITBOX TYPES

This tag only affects the ARC hitbox. It is ignored by all other hitbox types.

## TAG USAGE

- Skills, with an ARC hitbox.

## TAG FORMAT

`<degrees:VAL>`
Where VAL is the arc angle in degrees.

## TAG EXAMPLES

`<degrees:120>`
This skill's arc angle is 120 degrees.