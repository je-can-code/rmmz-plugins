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
  - key: J-SDP
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Popups

Supplies the `TextPopBuilder` (with its SDP points styling), `Map_TextPop` types and `TextPopManager` dispatch that the
SDP popups are built and shown through.

## J-SDP

Supplies the `onSdpRewardGranted` and `onSdpPanelUnlocked` events these popups hang off, and the panel list the unlock
popup reads its panel name from.