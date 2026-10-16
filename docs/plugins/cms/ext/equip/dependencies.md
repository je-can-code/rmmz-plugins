---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.2.0
    base: true
    orderAfter: true
  - key: J-CMS
    version: 1.0.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-CMS

Supplies the shared parameter-catalog rendering that draws the equip scene's parameter grid, and the `J.CMS.EXT`
namespace this plugin lives under; see the [J-CMS book](../../core/overview.md).