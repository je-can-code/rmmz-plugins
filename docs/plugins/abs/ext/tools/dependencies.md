---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.6.0
    base: true
    orderAfter: true
  - key: J-ABS
    version: 4.20.1
    base: true
    orderAfter: true
  - key: J-Base-Save
    version: 1.0.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the on-hit hook gap closing and pull-forward run from, the jump, glide and terrain-walking movement they travel
by, and the `<knockbackResist>` and `<ignoreTerrain>` tags a pull honors.

## J-Base-Save

Routes the `_tools` namespace into its own save section.