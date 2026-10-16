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
    version: 4.8.2
    base: false
    orderAfter: true
  - key: J-Base-Save
    version: 1.0.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Lets a level tag in an enemy event's comments override that enemy's level, and shows each enemy's level, or `???`, in
front of its name on the map.

## J-Base-Save

Routes the `_level` namespace into its own save section.