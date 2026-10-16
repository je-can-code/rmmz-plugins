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
  - key: J-ABS
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

## J-ABS

Supplies `JABS_Battler#aiSkillFilter`, the enemy AI's skill-pool filter this plugin extends to turn extension skills
away.

## J-Extend

Answers `isExtension` for each skill the AI weighs (true for an `<extend>` or `<extendType>` tag), and owns the
`J.EXTEND.EXT` namespace this plugin lives under.