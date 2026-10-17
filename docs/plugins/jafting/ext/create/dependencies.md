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
    version: 2.1.0
    base: true
    orderAfter: true
  - key: J-Base-Save
    version: 1.0.0
    base: false
    orderAfter: true
  - key: J-SDP
    version: 2.0.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-JAFTING

Supplies the root JAFTING menu this plugin adds its Creation row to, and the salvage stamping that records what each
craft was made from.

## J-Base-Save

Routes the `_crafting` namespace into its own save section.

## J-SDP

Backs the SDP component type: affordability reads the party leader's points, and a craft charges or credits every party
member's.