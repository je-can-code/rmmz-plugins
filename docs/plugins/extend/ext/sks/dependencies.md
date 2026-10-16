---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    base: true
    orderAfter: true
  - key: J-SkillSlots
    base: true
    orderAfter: true
  - key: J-Extend
    version: 1.7.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-SkillSlots

Provides `Window_SkillEquipDetail`, the skill equip detail window this plugin makes display the overlayed skill.

## J-Extend

Resolves the overlayed skill through its `Game_Battler#skill` override, which folds the actor's learned extensions of
the base skill into it.