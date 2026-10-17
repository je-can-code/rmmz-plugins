---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.3.0
    base: true
    orderAfter: true
  - key: J-ABS
    base: false
    orderAfter: true
  - key: J-HUD
    base: false
    orderAfter: true
  - key: J-TIME
    base: false
    orderAfter: true
  - key: J-ABS-InputManager
    version: 2.3.0
    base: false
    orderAfter: true
  - key: J-Base-Save
    version: 1.0.0
    base: false
    orderAfter: true
  - key: J-Omnipedia
    base: false
    orderAfter: true
  - key: J-OMNI-Quests
    base: false
    orderAfter: true
  - key: J-Pixelistics
    version: 1.4.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the enemy battlers and loot the minimap draws as markers, the loot-drop hook (`JABS_Engine#addLootDropToMap`)
that tags fresh loot for the minimap, and the `JABS_InputAdapter` the minimap's shortcut actions are performed through.

## J-HUD

Lets the minimap hide along with the rest of the HUD: with [Respect JABS HUD Visibility](parameters/respect-hud-hide.md)
on, it asks `$hudManager.canShowHud()` every frame.

## J-TIME

Nothing in this plugin's code reads J-TIME; only a comment and the load order mention it.

## J-ABS-InputManager

Provides the input action registry the minimap's toggle and hold-to-expand shortcuts are registered into, the D-pad
symbols they default to, the controller they are polled from, and the remap window that lists them.

## J-Base-Save

Routes the `_map` namespace into its own save section.

## J-Omnipedia

Supplies the `J.OMNI` namespace the minimap looks under to tell whether the quest plugin is installed.

## J-OMNI-Quests

Lets the minimap mark events that run the quest commands `unlock-quests`, `progress-quest` or `finalize-quest` as quest
offer, progress or turn-in markers, finding them by the plugin's own name.

## J-Pixelistics

Gives an event page its area through `<areaEvent:[WIDTH, HEIGHT]>`; the minimap reads that area to stretch a teleport
marker across it.