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
  - key: J-ABS
    version: 4.13.0
    base: true
    orderAfter: true
  - key: J-ABS-InputManager
    version: 2.3.0
    base: false
    orderAfter: true
  - key: J-CMS
    version: 1.0.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the skill slots this scene assigns into, the pool of skills each slot accepts, and the item reads behind
`<jabsTool>` and `<hideFromJabsMenu>`.

## J-ABS-InputManager

Defines `JABS_Button`, whose keys name every slot shown here and whose combat skill compositions make up those slots'
labels.

## J-CMS

Places the loadout command in the main menu's actor column, and loads first because it overwrites the `Scene_Menu`
command window setup this plugin wires its command through.