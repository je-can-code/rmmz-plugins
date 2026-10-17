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
    version: 4.13.0
    base: true
    orderAfter: true
  - key: J-ABS-Metrics
    version: 1.0.0
    base: true
    orderAfter: true
  - key: J-Omnipedia
    version: 1.1.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Announces every combat moment this plugin records through the `JABS_Engine` hooks it extends: a skill effect about to
land and having landed, an enemy or the player being defeated, and an action being executed.

## J-ABS-Metrics

Owns the lifetime counters, kept in game variables, that the Statistopedia reads its totals from, with
`J.ABS.EXT.METRICS.Metadata` naming each variable, and the `JABS_MetricsManager.isItemSlot` rule this plugin reuses to
keep item use out of its hit tallies.

## J-Omnipedia

Supplies the Omnipedia scene and root list this plugin adds its Statistopedia row to, and the `_omni` namespace on the
party its records are stored in.