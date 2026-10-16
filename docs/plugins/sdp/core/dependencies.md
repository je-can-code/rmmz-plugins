---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    base: true
    orderAfter: true
  - key: J-DropsControl
    base: true
    orderAfter: true
  - key: J-ABS
    base: false
    orderAfter: true
  - key: J-ABS-Speed
    version: 1.1.0
    base: false
    orderAfter: true
  - key: J-NaturalGrowth
    version: 3.0.0
    base: false
    orderAfter: true
  - key: J-Proficiency
    version: 2.1.0
    base: false
    orderAfter: true
  - key: J-Base-Save
    version: 1.0.0
    base: false
    orderAfter: true
  - key: J-CMS
    version: 1.1.0
    base: false
    orderAfter: true
  - key: J-CriticalFactors
    base: false
    orderAfter: false
    orderBefore: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-DropsControl

Supplies the enemy drop list and drop builder that `<sdpDropData>` adds its panel drops through.

## J-ABS

Grants SDP points to the whole party when a JABS enemy is defeated, and unlocks a dropped panel when the player picks it
up.

## J-ABS-Speed

Lets panels grow Movespeed Boost (`msb`) as a parameter.

## J-NaturalGrowth

Applies its buff and growth tags to the SDP multiplier (`sdr`), and adds its `<sdpPlus:[FORMULA]>` bonus to the SDP
points an enemy yields.

## J-Proficiency

Lets panels grow Proficiency+ (`prof`) as a parameter.

## J-Base-Save

Routes the `_sdp` namespace into its own save section.

## J-CMS

Shows each party member's unspent SDP points on their cell in the main menu.

## J-CriticalFactors

Lets panels grow CDM/CDR as parameters.