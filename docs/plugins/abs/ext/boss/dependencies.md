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
  - key: J-Log
    version: 3.0.3
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Carries the `bosses` block in its `data/config.jabs.json`, spawns each encounter's bodies from its enemy clone map, and
supplies the battlers this plugin forces skills through.

## J-Log

Optional. Owns the dialogue log on the map, which a `log` step writes its line to. Without J-Log a `log` step does
nothing, and every other step plays the same.