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
  - key: J-ABS-Food
    version: 1.1.0
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

Supplies the leader's JABS battler (`getPlayer1`), the state tracker (`getJabsStatesByUuid`) that the active phase's
remaining duration is read from, and the `postPartyCycling` hook the frame refreshes on.

## J-ABS-Food

Supplies the leader's food chain plan (`getFoodChainPlanByUuid`) that the frame renders, with each phase's state,
duration and color.

## J-HUD

Supplies the `Scene_Map` hooks the frame is created and updated through, and the `HudInterferenceResolver` that fades
it while the player stands on top of it.