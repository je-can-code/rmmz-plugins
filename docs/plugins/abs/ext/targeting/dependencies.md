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
    version: 4.20.0
    base: true
    orderAfter: true
  - key: J-ABS-InputManager
    version: 2.1.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the mainhand, offhand and combat skill inputs this plugin diverts into a targeting session, the AI,
engagement, input and movement gates it holds shut while the player aims, and the hitbox math and pulse sprites behind
its range ring and area preview.

## J-ABS-InputManager

Supplies the dedicated d-pad symbols the cursor reads beside `Input.dir8`, so the d-pad can step through targets and
steer the free cursor, and the `JABS_Button` slots a confirmed action's cooldown is stamped against.