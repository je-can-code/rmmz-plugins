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
  - key: J-ABS
    version: 4.29.0
    base: false
    orderAfter: true
  - key: J-NaturalGrowth
    version: 3.0.0
    base: false
    orderAfter: true
  - key: J-Extend
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Reads the on-crit state tags as its on-chance effects, and rolls every state they carry through its state roll: the
recipient's resistances, the luck between the two battlers on a harmful state, and their fate all weigh in, and the recipient's immunities
are checked on every landing. Without it, the on-crit state tags do nothing.

## J-NaturalGrowth

Enables buff/growth and rate/plus for the `cdm` and `ctr` parameters.

## J-Extend

Registers the conditional and guaranteed crit tags as non-combining, so merging an extension skill appends those lines
rather than overwriting them.