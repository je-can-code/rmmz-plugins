---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.10.0
    base: true
    orderAfter: true
  - key: J-SDP
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-SDP

Supplies the panels that the `\sdp[SDP_KEY]` text code looks up by key, to draw each panel's icon, name and rarity
colour.