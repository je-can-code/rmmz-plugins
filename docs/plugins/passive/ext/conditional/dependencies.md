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
    version: 4.13.0
    base: true
    orderAfter: true
  - key: J-Passive
    version: 2.3.0
    base: true
    orderAfter: true
  - key: J-Passive-Affix
    version: 1.3.0
    base: false
    orderAfter: true
  - key: J-CriticalFactors
    base: false
    orderAfter: true
  - key: J-Pixelistics
    version: 1.3.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the map battlers the rules run on, the combat events that fire them (damage, hits, kills, knockbacks, state
infliction, action expiry), the forced map actions `autoExecuteSkill` fires, and the skill-slot cooldowns the gate and
cooldown tags read and change.

## J-Passive

Supplies the sources every rule is read from, the inclusion and stack hooks the gate and stack count tags plug into,
and the Passives view this plugin draws its tag lines in.

## J-Passive-Affix

Draws its skill-history lines under a state's header in the Passives view, ahead of this plugin's tag lines.

## J-CriticalFactors

Decides which hits are critical, the flag the `whenCrit` condition reads once `Game_Action#apply` has run.

## J-Pixelistics

Supplies the whole-tile steps (`updatePixelStepping`) the `move` condition counts.