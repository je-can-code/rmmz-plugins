---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.7.0
    base: true
    orderAfter: true
  - key: J-ABS
    version: 4.25.0
    base: true
    orderAfter: true
  - key: J-Motion
    version: 1.1.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the map battlers everything here animates, and the defeat, page change, respawn, Spawn Enemy, party cycling
and loot drop hooks that start and stop each motion.

## J-Motion

Supplies the motion system itself: the `<motion:...>` parser a state's note is read with, the composer every motion here
is declared through, and the registry the death and fold animations join as motion types.