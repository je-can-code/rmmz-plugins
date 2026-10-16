---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.16.1
    base: true
    orderAfter: true
  - key: J-Message
    version: 2.0.0
    base: true
    orderAfter: true
  - key: J-Message-Bubbles
    version: 1.2.1
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Message

Lays each chatter line out into glyphs through its message pipeline, holds the `chatter` section of
`data/config.message.json` the project defaults come from, and fades a finished line out the way a message fades.

## J-Message-Bubbles

Draws each chatter line as its bubble over whoever its `\pop` target grammar names, and says which character a message
is opening above so that character stops muttering.