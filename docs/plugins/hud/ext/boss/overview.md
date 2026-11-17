---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [hud-boss, overview]
version: "1.2.0"
---

# Overview

This plugin is an extension of the [`J-HUD-TargetFrame`](../target/overview.md) plugin, designed for JABS. It generates
a window on the map displaying a single target at a much bigger scale than the `J-HUD-TargetFrame` does.

## Choosing the boss

The frame shows whichever boss it was last handed, by one of two script calls:

- `BossFrameManager.setBossFromEncounter()` frames the boss of the running
  [`J-ABS-Boss`](../../../abs/ext/boss/overview.md) encounter. Use it for any fight that plugin runs: its bosses are
  spawned when the fight starts, so nobody knows their event ids ahead of time. Call it after `start-encounter`. With no
  fight running, or its boss off the map, it reports the error and throws.
- `BossFrameManager.setBossByEventId(eventId)` frames the battler on that event of the current map, for a boss placed on
  the map by hand.

Either way, `BossFrameManager.requestShowBossFrame()` brings the frame up and `BossFrameManager.requestHideBossFrame()`
puts it away.

The frame never outlives its map or its game. Leaving the map, starting a new game or loading a save stands it down and
forgets the boss it was showing, so a party that wipes or walks out mid-fight never carries the frame along.

## Note about notetags

This plugin has no notetags of its own- it displays whichever battler one of the script calls above handed it, not a
specially-tagged "boss".