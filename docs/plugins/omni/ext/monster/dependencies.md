---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.3.0
    base: true
    orderAfter: false
  - key: J-ABS
    version: 4.26.1
    base: true
    orderAfter: false
  - key: J-DropsControl
    version: 2.5.0
    base: true
    orderAfter: false
  - key: J-Elementalistics
    base: true
    orderAfter: false
  - key: J-SDP
    version: 2.1.0
    base: true
    orderAfter: false
  - key: J-Omnipedia
    version: 1.1.0
    base: true
    orderAfter: false
  - key: J-HUD
    base: false
    orderAfter: true
  - key: J-HUD-TargetFrame
    version: 1.1.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the on-hit hook the Monsterpedia learns which elements were used against an enemy from, and the `$gameEnemies`
registry the detail window reads each enemy's stats and rewards from.

## J-DropsControl

Supplies the enemy drop list the detail window renders, and the `postProcessDroppedLoot` hook each drop that falls is
recorded as observed through.

## J-Elementalistics

Supplies `Game_Action.extractElementsFromAction`, which finds the extra elements an action carries so they can be
recorded as observed, and the absorb check the detail window shows beside each element.

## J-SDP

Supplies the SDP points an enemy yields, its panel drop data, and the panel lookup the detail window draws the drop
chance and unlock state from.

## J-Omnipedia

Supplies the Omnipedia scene and root list this plugin adds its Monsterpedia command to, and the `_omni` namespace on
the party its observations are stored in.

## J-HUD

Only its `J.HUD` namespace is read, as the first half of the check that the target frame is present; this plugin loads
after it so that check can see it.

## J-HUD-TargetFrame

Supplies the `getTargetFrameIcon` this plugin extends so an enemy's `<monsterFamilyIcon:ICON_INDEX>` fills the target
frame icon when nothing else names one; without it that extension is skipped.