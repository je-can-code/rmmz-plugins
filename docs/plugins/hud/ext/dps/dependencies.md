---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.2.0
    base: true
    orderAfter: true
  - key: J-ABS
    base: true
    orderAfter: true
  - key: J-ABS-Dps
    version: 1.0.0
    base: true
    orderAfter: true
  - key: J-HUD
    version: 2.3.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the `$jabsEngine` that carries the tracker, and the uuid (`getUuid`) each battle member is looked up by.

## J-ABS-Dps

Supplies the tracker whose `rollingDpsBy`, `currentDpsBy` and `previousDpsBy` produce every figure on the readout.

## J-HUD

Supplies the `Scene_Map` hooks the readout is created through, the `$hudManager` that hides it with the rest of the HUD,
and the `HudInterferenceResolver` that fades it while the player stands on top of it.