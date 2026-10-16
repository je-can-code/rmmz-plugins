---
type: notetag
title: Thickness
description: The tag defining how many extra tiles of width a LINE or WALL hitbox occupies.
tags: [abs, tag, skill, hitbox, line, wall]
---

# Thickness

## Description

Controls how many extra tiles of width a LINE or WALL hitbox occupies perpendicular to its primary axis.

For a LINE hitbox, thickness grows the hit area sideways. For a WALL hitbox, thickness grows the hit area
upward/downward.

## NOTE ABOUT HITBOX TYPES

This tag only affects LINE and WALL hitboxes.

## TAG USAGE

- Skills, with a LINE or WALL hitbox.

## TAG FORMAT

`<thickness:VAL>`
Where VAL is the additional perpendicular width in tiles.

## TAG EXAMPLES

`<thickness:1>`
This skill's hitbox occupies 1 additional tile of perpendicular width.