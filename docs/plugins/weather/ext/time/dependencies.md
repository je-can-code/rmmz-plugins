---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.18.0
    base: true
    orderAfter: true
  - key: J-Weather
    version: 1.0.0
    base: true
    orderAfter: true
  - key: J-TIME
    version: 2.1.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Weather

Draws the sky this plugin decides, and supplies the weather config, the map resolver that climates bend and the
diagnostic forecast reuses, and the preset and strength ids the page tags match.

## J-TIME

Supplies the clock and calendar the sky is walked across, announces each change of time, and owns the time window this
plugin adds a weather line to.