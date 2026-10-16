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
  - key: J-CMS
    version: 1.2.1
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

## J-CMS

Draws every listed parameter through its catalog renderer, so a stat reads the same as on the equip screen, and seats
the class command in its main menu's actor column.

## J-Base-Save

Routes the `_class` namespace into its own save section.