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
    version: 4.3.1
    base: true
    orderAfter: true
  - key: J-HUD
    version: 2.3.0
    base: true
    orderAfter: true
  - key: J-ABS-Shield
    base: false
    orderAfter: false
    orderBefore: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the leader's JABS battler (`leaderJabsBattler`) whose `isInCombat` and `getCombatSecondsRemaining` drive the
in combat indicator.

## J-HUD

Supplies the `Scene_Map` hooks the frame is created, updated and refreshed through, the `$hudManager` that shows,
hides and refreshes it, the `StateAfflictionHudPresenter` that draws the leader's states, and the
`HudInterferenceResolver` that fades it while the player stands on top of it.

## J-ABS-Shield

Draws the shield gauge on this frame by extending `Window_PartyFrame`, so this plugin has to load ahead of it.