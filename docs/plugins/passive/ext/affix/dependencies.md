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
    version: 2.1.0
    base: true
    orderAfter: true
  - key: J-ABS-Speed
    version: 1.0.0
    base: true
    orderAfter: true
  - key: J-ABS-Tools
    version: 1.1.0
    base: true
    orderAfter: true
  - key: J-ABS-Timing
    version: 1.0.3
    base: true
    orderAfter: true
  - key: J-ABS-Shield
    version: 1.0.0
    base: true
    orderAfter: true
  - key: J-Extend
    version: 1.7.0
    base: true
    orderAfter: true
  - key: J-HUD-TargetFrame
    version: 2.0.0
    base: false
    orderAfter: true
  - key: J-Message
    version: 2.0.0
    base: false
    orderAfter: true
  - key: J-HUD
    base: false
    orderAfter: true
  - key: J-Resources-ABS
    version: 1.0.0
    base: false
    orderAfter: true
  - key: J-SDP
    base: false
    orderAfter: true
  - key: J-Aptitude
    version: 2.0.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Supplies the spawn hook an enemy's affixes are rolled in, the experience and gold rewards `<rewardMultiplier>` scales,
the map nameplate whose stripe takes the tier color and pips, and the JABS state tags the Passives view lists.

## J-Passive

Supplies the passive states every affix is applied as, the reader of an event's `<passive:[...]>` comments, and the
Passives detail window this plugin adds its JABS rows to.

## J-ABS-Speed

Supplies the `<speedBoost>` tag the Passives view lists as a Speed Boost row.

## J-ABS-Tools

Supplies the `<gapCloseTarget>` tag the Passives view lists as a Gap Close Target row.

## J-ABS-Timing

Supplies the `<castTimeFlat>`, `<castSpeedRate>`, `<fastCooldownFlat>` and `<fastCooldownRate>` tags the Passives view
lists as Cast Time and Cooldown rows.

## J-ABS-Shield

Supplies the `<shield>` and `<shieldProtect>` tags the Passives view lists in its Shield section.

## J-Extend

Supplies the `<onCastSelfState>` tag the Passives view lists as an On Cast row.

## J-HUD-TargetFrame

Supplies the target frame whose enemy name this plugin wraps in the tier words, leads with the tier icons and tints with
the tier color.

## J-Message

Nothing in this plugin's code reads it; it is only declared so that it loads before this plugin.

## J-HUD

Its `J.HUD` namespace is what this plugin tests before it looks for the target frame under it.

## J-Resources-ABS

Supplies the on-attack and when-hit HP, MP and TP gain tags the Passives view lists as Combat rows.

## J-SDP

Supplies the SDP points reward `<rewardMultiplier>` scales through `determineSdpGained`, and the name its tag
description gives that reward.

## J-Aptitude

Supplies the AP reward `<rewardMultiplier>` scales through `determineApGained`, and the name and icon its tag
description gives that reward.