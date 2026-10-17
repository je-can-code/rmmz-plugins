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
  - key: J-LevelMaster
    base: true
    orderAfter: true
  - key: J-ABS
    base: false
    orderAfter: true
  - key: J-Level-Flat
    version: 1.0.0
    base: false
    orderAfter: true
  - key: J-Base-Save
    version: 1.0.0
    base: false
    orderAfter: true
  - key: J-HUD
    base: false
    orderAfter: true
  - key: J-HUD-PartyFrame
    base: false
    orderAfter: true
  - key: J-HUD-TargetFrame
    version: 2.0.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-LevelMaster

Supplies the `getLevel()` this plugin overlays the sync onto, the real level it keeps for EXP, the class curve that
reads the effective level, and the `J.LEVEL.EXT` namespace it lives under.

## J-ABS

Supplies the kill reward flow whose `determineExperienceGained` this plugin wraps, which it does only when J-Level-Flat
is installed too.

## J-Level-Flat

Supplies the level-difference EXP policy this plugin feeds the real level to, so without it the Sync Affects EXP
parameter changes nothing.

## J-Base-Save

Routes the `_levelSync` namespace into its own save section.

## J-HUD

Supplies the `J.HUD` namespace that the party and target frame hooks check before installing.

## J-HUD-PartyFrame

Supplies the party frame's level readout, which this plugin gives a sync icon, a blue outline and the real level in
parentheses.

## J-HUD-TargetFrame

Supplies the target frame's `targetLevelColor` hook, which this plugin uses to draw a synced target's level in light
blue.