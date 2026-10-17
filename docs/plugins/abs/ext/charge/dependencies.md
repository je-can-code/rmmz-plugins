---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-ABS
    version: 4.13.0
    base: true
    orderAfter: true
  - key: J-ABS-InputManager
    base: false
    orderAfter: true
  - key: J-Extend
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-ABS

Supplies the battlers, skill slots and actions that a charge is built from, and that the charged skill is released
through.

## J-ABS-InputManager

Supplies the player's input controller and its button symbols, which this plugin extends to notice a skill slot's
input being held down.

## J-Extend

Registers `<chargeTier>` as a non-combining key, so `<chargeTier>` lines from separate extension skills are appended
rather than overwritten when they are merged.