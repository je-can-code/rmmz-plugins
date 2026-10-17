---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 4.0.0
    base: true
    orderAfter: true
  - key: J-DropsControl
    base: true
    orderAfter: true
  - key: J-CriticalFactors
    version: 1.0.0
    base: true
    orderAfter: true
  - key: J-SDP
    base: true
    orderAfter: true
  - key: J-Proficiency
    base: true
    orderAfter: true
  - key: J-NaturalGrowth
    version: 2.1.2
    base: true
    orderAfter: true
  - key: J-Elementalistics
    version: 1.3.0
    base: true
    orderAfter: true
  - key: J-ABS
    version: 4.13.0
    base: false
    orderAfter: true
  - key: J-Aptitude
    version: 1.1.0
    base: false
    orderAfter: true
  - key: J-Base-Save
    version: 1.0.0
    base: false
    orderAfter: true
  - key: J-Resources
    version: 1.0.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-DropsControl

Shows a passive state's `<dropMultiplier:NUM>` and `<goldMultiplier:NUM>` in the Rewards section of the passive detail
window.

## J-CriticalFactors

Shows a passive state's `<critReduction:NUM>` and `<critMultiplier:NUM>` in the Parameters section of the passive detail
window.

## J-SDP

Shows a passive state's `<sdpMultiplier:AMOUNT>` in the Rewards section of the passive detail window.

## J-Proficiency

Shows a passive state's `<proficiencyBonus:NUM>` in the Rewards section of the passive detail window.

## J-NaturalGrowth

Shows a passive state's natural buff and growth tags in the Parameters section of the passive detail window, and its
`<expPlus:[FORMULA]>`, `<goldPlus:[FORMULA]>` and `<sdpPlus:[FORMULA]>` in its Rewards section, each evaluated against
the viewed actor.

## J-Elementalistics

Shows a passive state's `<boostElement:[ELEMENT_ID, PERCENT_BOOST]>` and `<absorbElements:[NUM,NUM,...]>` in the
Elements section of the passive detail window.

## J-ABS

Keeps passive states out of the pool JABS's priority-based state removal draws from, by overriding its
`getPurgeableStates`, and shows a passive state's `<cdr:[FORMULA]>` in the passive detail window.

## J-Aptitude

Shows a passive state's `<aptMultiplier:AMOUNT>` in the Rewards section of the passive detail window.

## J-Base-Save

Routes the `_passive` namespace into its own save section.

## J-Resources

Shows a passive state's `<hcr:[VALUE]>` as its life cost in the Parameters section of the passive detail window.