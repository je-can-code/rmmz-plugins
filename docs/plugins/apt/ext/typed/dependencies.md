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
  - key: J-Aptitude
    version: 2.0.0
    base: true
    orderAfter: true
  - key: J-ABS
    base: false
    orderAfter: true
  - key: J-Log
    version: 3.0.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Aptitude

Supplies the AP machinery this plugin types: the `ApManager` distribution of AP, the teachable list that
`buildAptitudeTeachings` builds, the kill reward flow in `gainAptitudeReward`, and the aptitude scene's detail windows
that the typed badge is drawn into.

## J-ABS

Supplies the kill flow that typed AP is awarded through (`JABS_Engine`, its reward scaling multiplier and the battlers
behind the party members), so without it only the plugin commands grant typed AP.

## J-Log

Receives a log line naming the type of each typed AP gain, through `$mapLogs.action`, when it is installed.