---
type: notetag
title: Dodge Movetype
description: The tag defining which direction a dodge skill moves the player.
tags: [abs, tag, skill, dodge, movement]
---

# Dodge Movetype

## Description

- `forward`: Move in the direction the player is facing.
- `backward`: Move in the opposite direction.
- `directional`: Move in whatever direction the player is pressing.

## TAG USAGE

- Skills, of the dodge skill type.

## TAG FORMAT

`<moveType:TYPE>`
Where TYPE is one of "forward", "backward", or "directional".

## TAG EXAMPLES

`<moveType:directional>`
This dodge moves the player in whatever direction the player is pressing.