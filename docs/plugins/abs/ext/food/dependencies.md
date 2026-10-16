---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.11.0
    base: true
    orderAfter: true
  - key: J-ABS
    version: 4.13.0
    base: true
    orderAfter: true
  - key: J-ABS-InputManager
    version: 2.3.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the usable-item slot food is eaten from, the executed actions a chain-ending skill is caught in, and the
`<applyStateOnExpire>` and `<stateDuration>` state timers a food chain advances by.

## J-ABS-InputManager

Supplies the `UsableItem` button and its R2 binding, and the remap screen this plugin adds a Usable Item section to.