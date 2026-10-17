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
  - key: J-LevelMaster
    base: true
    orderAfter: true
  - key: J-ABS
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-LevelMaster

Supplies the battler levels the level difference is measured from, the party's average level for turn-based battles, and
the level scaling toggle that turn-based battles consult before awarding the flat experience.

## J-ABS

Supplies the kill reward flow this plugin replaces `determineExperienceGained` in, and the `canGainReward` gate it
consults, so without it only turn-based battles use the flat experience.