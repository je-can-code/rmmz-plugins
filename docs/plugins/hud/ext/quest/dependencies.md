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
  - key: J-HUD
    version: 2.3.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-HUD

Supplies the `Scene_Map` hooks the frame sets up its members in and is refreshed from, the `$hudManager` that hides it
with the rest of the HUD and carries its refresh requests, and the `HudInterferenceResolver` that fades it while the
player stands on top of it.