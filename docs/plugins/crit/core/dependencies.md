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

## J-NaturalGrowth

Enables buff/growth and rate/plus for the `cdm` and `ctr` parameters.

## J-Extend

Registers the conditional and guaranteed crit tags as non-combining, so merging an extension skill appends those lines
rather than overwriting them.