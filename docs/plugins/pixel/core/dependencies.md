---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 4.2.0
    base: true
    orderAfter: true
  - key: J-Base-Save
    version: 1.0.0
    base: false
    orderAfter: true
  - key: J-ABS
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Base-Save

Routes the `_pixel` namespace into its own save section.

## J-ABS

Keeps JABS action events out of its route repetition and character collision, and wraps the Transfer Player command that
`J-ABS` swaps in while it is enabled, which is why this plugin loads after it.