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
  - key: J-Extend
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Extend

Registers `<drops>` as a non-combining tag, so when `J-Extend` merges an extension's note into a state or skill, the
`<drops>` lines of both are kept rather than the extension's replacing the original's.