---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.0.0
    base: true
    orderAfter: true
  - key: J-Message
    version: 2.1.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Message

Lays each message out into glyphs ahead of the reveal so a bubble can be sized to its own text, and supplies the glyph
effects a spent bubble freezes, the box an ordinary message returns to, and the fade a finished conversation leaves
through.