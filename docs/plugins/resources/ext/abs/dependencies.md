---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.19.0
    base: true
    orderAfter: true
  - key: J-Resources
    version: 1.0.0
    base: true
    orderAfter: true
  - key: J-ABS
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Resources

Supplies the `hcrSources()` battler sources the on-attack and when-hit tags are read from, and the
`gainHpFromResource`, `gainMpFromResource` and `gainTpFromResource` methods every gain, steal and heal event is applied
through.

## J-ABS

Supplies the on-map hit (`JABS_Engine#postPrimaryBattleEffects`) the on-attack, when-hit and steal gains fire from, and
the battler tracking and distances the heal events use to find allies in range.