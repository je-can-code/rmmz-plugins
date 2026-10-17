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
  - key: J-Motion
    version: 1.1.0
    base: true
    orderAfter: true
  - key: J-ABS-InputManager
    base: false
    orderAfter: true
  - key: J-ABS-Poses
    base: false
    orderAfter: true
  - key: J-ABS-Hitstop
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the map actions, hits and casts this plugin reacts to, the offhand skill data it infers an overlay's icon
from, and the loaded `data/config.jabs.json` its `juice` block is read out of.

## J-Motion

Owns the composer every body reaction and casting motion is declared on, the motion type registry those motions are
registered in, and the target resolver the overlay commands use to find their character.

## J-ABS-InputManager

Supplies the `JABS_Button` slot keys this plugin compares an action's slot against, to give a dodge its squish and to
pick the weapon or shield icon for an offhand strike.

## J-ABS-Poses

Loads first, so the caster juice this plugin adds to `executeMapAction` runs after the attack pose it sets there.

## J-ABS-Hitstop

Loads first, so the hit reaction this plugin adds to `postPrimaryBattleEffects` runs after the hitstop it applies
there.