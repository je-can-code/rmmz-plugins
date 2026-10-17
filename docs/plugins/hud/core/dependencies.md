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
    version: 4.25.0
    base: true
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

Supplies the tracked states and the `StateAffliction*` models that the state affliction presenter draws, and the
`Scene_Map#onPartyRotate` hook that the HUD refreshes itself on.

## J-Base-Save

Routes the `_hud` namespace into its own save section.