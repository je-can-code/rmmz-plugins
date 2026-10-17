---
type: plugin-parameter
title: Maximum Level Threshold Plugin Parameter
description: A plugin parameter defining the maximum allowed difference between actor and enemy to still gain AP.
tags: [ap, parameter, level]
param:
  key: max-level-threshold
  type: number
  text: Max Level Threshold
  desc: The max allowed difference in level between actor and enemy to gain AP from.
  min: -1
  default: 10
---

# Parameter: `max-level-threshold`

The maximum threshold allowed between an actor and enemy's level. If the difference is greater than this value, then
the actor will gain no AP from defeating the foe.

This requires the J-LevelMaster AND J-ABS plugins to do anything.

If the value is -1, the functionality is entirely disabled.
