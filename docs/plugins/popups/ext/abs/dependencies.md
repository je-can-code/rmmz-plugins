---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 2.2.0
    base: true
    orderAfter: true
  - key: J-Popups
    version: 2.1.0
    base: true
    orderAfter: true
  - key: J-ABS
    version: 4.13.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Popups

Supplies the `TextPopBuilder` and `TextPopManager` every popup here is built and dispatched through, along with the
merge stack (`Sprite_MapDamage`, layout rings and `PopupEmitter` events) that this plugin's merge controller drives.

## J-ABS

Supplies the combat and reward events these popups are built from (strikes, slip ticks, tool use, experience, gold,
loot, level-ups and skill learns) and the battlers whose map characters carry them.