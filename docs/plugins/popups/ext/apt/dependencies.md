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
  - key: J-Aptitude
    version: 2.0.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Popups

Supplies the `TextPopBuilder`, `Map_TextPop` types and `TextPopManager` dispatch that the AP popups are built and shown
through.

## J-Aptitude

Supplies the AP reward flow these popups hang off (`gainAptitudeReward` and its eligibility check) and the AP icon that
`IconManager.apPoints` hands the popup.