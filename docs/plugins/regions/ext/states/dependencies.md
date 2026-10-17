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
    version: 4.13.0
    base: true
    orderAfter: true
  - key: J-RegionEffects
    version: 1.2.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Applies each region state to the standing battler through its state handling, rolls the chance through its lucky and
cursed on-chance system, and plays the animation through its character animation request.

## J-RegionEffects

Supplies the `_regions` namespace this plugin keeps its data in, the `J.REGIONS.EXT` namespace it registers under, and
the `canRefreshRegionEffects` gate its map note parsing shares.