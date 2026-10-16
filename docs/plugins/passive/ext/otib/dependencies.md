---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.3.0
    base: true
    orderAfter: true
  - key: J-Passive
    version: 2.1.0
    base: true
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

## J-Passive

Supplies the passive state pipeline the unlocked states are fed through, as one synthetic `<passive:[STATE_IDS]>`
source per unlock added to the actor's passive sources, and the `Scene_Passive` viewer this plugin adds its Item Boosts
tab to.

## J-Base-Save

Routes the `_otib` namespace into its own save section.