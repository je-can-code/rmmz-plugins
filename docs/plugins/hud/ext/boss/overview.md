---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [hud-boss, overview]
version: "1.1.0"
---

# Overview

This plugin is an extension of the [`J-HUD-TargetFrame`](../target/overview.md) plugin, designed for JABS. It generates
a window on the map displaying a single target at a much bigger scale than the `J-HUD-TargetFrame` does.

## Choosing the boss

The frame shows whichever boss it was last handed, by one of two script calls:

- `BossFrameManager.setBossFromEncounter()` frames the boss of the running
  [`J-ABS-Boss`](../../../abs/ext/boss/overview.md) encounter. Use it for any fight that plugin runs: its bosses are
  spawned when the fight starts, so nobody knows their event ids ahead of time. Call it after `start-encounter`.
- `BossFrameManager.setBossByEventId(eventId)` frames the battler on that event of the current map, for a boss placed on
  the map by hand.

Either way, `BossFrameManager.requestShowBossFrame()` brings the frame up and `BossFrameManager.requestHideBossFrame()`
puts it away.

## Note about notetags

This plugin has no notetags of its own- it displays whichever battler is the player's current target, not a
specially-tagged "boss".