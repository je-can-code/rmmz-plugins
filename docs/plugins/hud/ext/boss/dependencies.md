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
    base: true
    orderAfter: true
  - key: J-HUD
    version: 2.4.0
    base: true
    orderAfter: true
  - key: J-HUD-TargetFrame
    version: 2.0.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the JABS battler behind the boss, found through `Game_Character#getJabsBattler` and
`JABS_AiManager.getBattlerByUuid`.

## J-HUD

Supplies the `Scene_Map` hooks (`initHudMembers` and `updateHudFrames`) that the boss frame is created and updated
through, and the `J.HUD.EXT` namespace it lives in.

## J-HUD-TargetFrame

Supplies `Window_TargetFrame`, which the boss frame extends, along with the `FramedTarget` model and the
`canShowTargetFrame` and `decorateFramedTarget` hooks the boss frame aliases and calls.