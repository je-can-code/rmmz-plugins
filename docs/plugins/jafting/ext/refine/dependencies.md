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
  - key: J-JAFTING
    version: 2.1.3
    base: false
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

## J-JAFTING

Hosts the [JAFTING menu](../../core/scenes/jafting.md) that the Refinement command is added to, and supplies the
material-type checks and salvage ledgers that the refinement lists and refined equipment are built with.

## J-Base-Save

Routes the `_refinement` namespace into its own save section.