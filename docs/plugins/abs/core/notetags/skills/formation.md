---
type: notetag
title: Formation
description: The tag defining the direction pattern in which a skill's projectiles fire.
tags: [abs, tag, skill, projectile, formation]
---

# Formation

## Description

Defines the direction pattern in which projectiles fire. Valid values:

- `line`: Fires in a straight line.
- `spray`: Fires in a spray pattern (like a W).
- `cross`: Fires in a cross (the four cardinal directions).
- `xburst`: Fires in an X (the four diagonal directions).
- `nova`: Fires in a circle (all 8 cardinal + diagonal directions).

## NOTE ABOUT PROJECTILE MOTION

Use "turn X degrees" instead of "turn X direction" in custom move routes, and "1 step forward/backward" instead of "Move
up/down/left/right". This preserves the illusion that projectiles respect the direction they were fired.

## NOTE ABOUT DIAGONALS

Use my `J-ABS-Diagonals` plugin for more precise rotation within custom move routes.

## TAG USAGE

- Skills

## TAG FORMAT

`<formation:VAL>`
Where VAL is one of the valid formation values listed above.

## TAG EXAMPLES

`<formation:spray>`
This skill's projectiles fire in a spray pattern (like a W).