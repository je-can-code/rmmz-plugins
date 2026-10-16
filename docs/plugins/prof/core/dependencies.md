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
  - key: J-ABS
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

## J-ABS

Lets guarding, parrying and dodging earn proficiency, by extending its `onGuard` and `onParry` hooks on `Game_Action`
and its `onDodge` hook on `JABS_Battler`.

## J-Base-Save

Routes the `_proficiency` namespace into its own save section, `proficiency`.