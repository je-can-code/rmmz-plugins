---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-ABS
    version: 4.13.0
    base: true
    orderAfter: true
  - key: J-Base
    version: 3.2.0
    base: true
    orderAfter: true
  - key: J-ABS-AllyAI
    base: false
    orderAfter: true
  - key: J-Base-Save
    version: 1.0.0
    base: false
    orderAfter: true
  - key: J-HUD
    base: false
    orderAfter: false
    orderBefore: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-ABS

Supplies the `JABS_BaseController` this plugin's controller extends, the `JABS_InputAdapter` that turns each input into
an action, and the engine hooks (`updateInput`, `performPartyCycling`) and player battler the controller drives.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS-AllyAI

Nothing in this plugin uses it; it is declared only so this plugin loads after it.

## J-Base-Save

Lets this plugin keep the player's key bindings in the installation's config file (`ConfigManager.registerField`)
instead of inside each savefile.

## J-HUD

Nothing in this plugin uses it; it is declared only so this plugin loads before it.