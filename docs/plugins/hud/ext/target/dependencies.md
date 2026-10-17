---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-ABS
    base: true
    orderAfter: true
  - key: J-Base
    version: 3.20.0
    base: true
    orderAfter: true
  - key: J-HUD
    version: 2.4.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-ABS

Supplies `JABS_Battler#setBattlerLastHit`, which this plugin extends to frame each enemy the player strikes, and the
JABS battler whose name, event and enemy the frame is built from.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-HUD

Supplies the `Scene_Map` hooks the frame keeps its members in and is handed new targets from, the `$hudManager` that
carries each new target and holds off the frame's fade, the `StateAfflictionHudPresenter` that draws the target's states
on one compact row, and the `HudInterferenceResolver` that fades it while the player stands on top of it.