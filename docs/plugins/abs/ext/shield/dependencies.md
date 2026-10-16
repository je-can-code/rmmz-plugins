---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.19.0
    base: true
    orderAfter: true
  - key: J-ABS
    version: 4.13.0
    base: true
    orderAfter: true
  - key: J-Elementalistics
    version: 1.2.0
    base: false
    orderAfter: true
  - key: J-HUD
    base: false
    orderAfter: true
  - key: J-HUD-PartyFrame
    version: 1.2.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the tracked states a shield is built onto, recalculated with whenever the state is reapplied, and removed
with, along with the forced map actions that fire shield break skills and the map gauges the shield gauge sits beside.

## J-Elementalistics

Supplies every element an action carries, which typed shields and typed bypasses are matched against.

## J-HUD

Owns the HUD namespace this plugin checks for the party frame before drawing shields into it.

## J-HUD-PartyFrame

Supplies the party frame and its value sprites, where each member's shield gauge is drawn above their HP gauge and the
leader's shield amount beside their HP numbers.