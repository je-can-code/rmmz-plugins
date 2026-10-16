---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.5.0
    base: true
    orderAfter: true
  - key: J-Lighting
    version: 1.0.0
    base: true
    orderAfter: true
  - key: J-TIME
    version: 2.0.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Lighting

Owns the composer this plugin declares the sky's colour and darkness to, under the `time` source, and the
`J.LIGHTING.EXT` namespace this plugin lives in.

## J-TIME

Supplies the hour the sky is read from, the `onTimeChanged` announcement it re-declares the sky on, and the six
four-hour phases the day is divided into.