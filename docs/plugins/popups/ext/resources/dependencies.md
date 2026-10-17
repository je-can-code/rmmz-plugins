---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 2.2.0
    base: true
    orderAfter: true
  - key: J-Popups
    version: 2.1.0
    base: true
    orderAfter: true
  - key: J-Resources
    version: 1.0.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Popups

Supplies the `TextPopBuilder` and its HP/MP/TP damage styling and layout rings that the cost and gain popups are built
with.

## J-Resources

Supplies the `Game_Battler` methods (`paySkillHpCost`, `gainHpFromResource`, `gainMpFromResource` and
`gainTpFromResource`) that fire whenever a cost is paid or a gain is applied, which these popups hang off.