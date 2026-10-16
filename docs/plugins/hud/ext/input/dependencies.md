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
    version: 4.13.0
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

Supplies the leader's JABS battler, skill slots and cooldowns (`getPlayer1`, `getActionKeyData` and `getCooldown`) that
every key on the frame is drawn from, along with the usable-item slot drawn beside them.

## J-HUD

Supplies the `Window_Frame` base class, the `$hudManager` that hides the frame and requests its refreshes, and the
`HudInterferenceResolver` that fades it while the player stands on top of it.