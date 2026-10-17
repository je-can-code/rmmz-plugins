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
    base: true
    orderAfter: true
  - key: J-ABS-AllyAI
    version: 3.2.0
    base: true
    orderAfter: true
  - key: J-Pixelistics
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the battlers, AI manager, dodge steps and hitbox overlays that this plugin steers with fractional movement
instead of tile steps.

## J-ABS-AllyAI

Supplies the ally formation movement that this plugin replaces with fractional-coordinate steps, along with the
formation tolerance and give-up tracking it reads.

## J-Pixelistics

Supplies the fractional-coordinate movement, subcell passability checks and collision hitbox that this plugin steers
JABS battlers with.