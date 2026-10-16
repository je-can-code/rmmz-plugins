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
    version: 4.13.0
    base: true
    orderAfter: true
  - key: J-ABS-InputManager
    base: false
    orderAfter: false
    orderBefore: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Turns the followers into `JABS_Battler`s and runs them through its AI manager, whose idle, spacing, leash and
skill-decision phases this plugin replaces for allies using the shared `JABS_AI` decision helpers.

## J-ABS-InputManager

Supplies the `JABS_Button` tool and dodge slot keys, which this plugin uses to keep allies from drawing skills out of
those two slots.