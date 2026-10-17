---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    base: true
    orderAfter: true
  - key: J-ABS
    version: 4.13.0
    base: true
    orderAfter: true
  - key: J-ABS-InputManager
    version: 2.3.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Announces every moment this plugin counts- defeats, landed skill effects, executed actions, guards, parries and item
use- and holds the `metrics` block of `data/config.jabs.json` that names each metric's variable.

## J-ABS-InputManager

Defines `JABS_Button`, whose slot keys bucket the usage tallies and mark the tool and usable item actions kept out of
the damage tallies.