---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-ABS
    version: 4.18.0
    base: true
    orderAfter: true
  - key: J-TIME
    version: 2.0.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-ABS

Owns the `<respawn:[METHOD, PARAM]>` tag and the respawn method registry (`JABS_RespawnManager`) these calendar methods
are registered with, which schedules each one at death and asks it during sweeps whether the battler is due.

## J-TIME

Supplies the clock and calendar every method reads (`$gameTime` and its `Time_Snapshot`), along with the names of the
times of day, weekdays and seasons the methods accept.