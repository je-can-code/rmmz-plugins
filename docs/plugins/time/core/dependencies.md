---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.8.0
    base: true
    orderAfter: true
  - key: J-ABS
    version: 4.1.0
    base: false
    orderAfter: true
  - key: J-ABS-InputManager
    version: 2.1.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Hosts the shortcut that toggles the TIME window on the map, which this plugin adds to J-ABS's `JABS_InputAdapter`.

## J-ABS-InputManager

Listens for the L3 button on its `JABS_StandardController`, which toggles the TIME window on the map.