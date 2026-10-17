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
  - key: J-CMS
    version: 1.0.0
    base: true
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

## J-CMS

Supplies the `J.CMS.EXT` namespace this plugin hangs itself off, and the version this plugin checks for at boot; see the
[J-CMS book](../../core/overview.md).

## J-Resources

Supplies the HP cost and the extra flat, percent and formula MP and TP costs that the skill detail pane breaks down;
without it the pane shows the vanilla MP and TP costs alone.