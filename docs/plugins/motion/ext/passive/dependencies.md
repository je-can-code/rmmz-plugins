---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.5.0
    base: true
    orderAfter: true
  - key: J-ABS
    base: true
    orderAfter: true
  - key: J-Motion
    version: 1.2.0
    base: true
    orderAfter: true
  - key: J-Motion-ABS
    version: 1.0.0
    base: true
    orderAfter: true
  - key: J-Passive
    version: 2.3.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the `JABS_AiManager` that tracks every battler on the map, hooked here so a battler's passive motions are
settled the moment it can be found: an enemy at spawn, and the leader on map setup and after every party cycle.

## J-Motion

Supplies the motion system itself: the composer that each passive's motions are declared to and withdrawn from, and the
`passive` rank that places them between an event page and an applied state.

## J-Motion-ABS

Supplies the bridge between a battler and the map character it rides, and the reader that turns a state's note into
motion declarations; both are used as they are.

## J-Passive

Supplies the passive states themselves: this plugin hooks `refreshPassiveStates`, the rebuild of a battler's whole
passive set, and reads the ids that rebuild leaves behind through `getPassiveStateIds`.