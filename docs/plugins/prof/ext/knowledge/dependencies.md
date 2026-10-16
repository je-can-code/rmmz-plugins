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
  - key: J-Proficiency
    version: 2.3.0
    base: true
    orderAfter: true
  - key: J-CMS
    version: 1.2.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Proficiency

Supplies the proficiency this plugin turns into knowledge, by way of `Game_Actor`'s `increaseSkillProficiency`, and the
loaded `config.proficiency.json` whose root the three knowledge blocks are read from.

## J-CMS

Shows each kind of knowledge on the main menu's currency strip, through `CurrencyDefinition` and `Window_Currencies`.