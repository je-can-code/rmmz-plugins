---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [level-sync, overview]
---

# Overview

This extension adds content level sync for dungeons and trials. When active, all party actors fight at a declared
effective level for the duration of the encapsulation. Real levels, EXP, and save data are never modified.

## Integrations

Integrates with:

- [`J-Base`](../../../_base/core/overview.md); required foundation for all J plugins.
- [`J-LevelMaster`](../../core/overview.md); this extension hooks into `getLevel()` — required base.
- [`J-Level-Flat`](../flat/overview.md); EXP policy interaction controlled by the
  [Sync Affects EXP](parameters/sync-affects-exp.md) parameter (default off — real level governs EXP rewards).
- [`J-Natural`](../../../natural/core/overview.md); parameter buff refresh is triggered on sync toggle when loaded.
- [`J-ABS`](../../../abs/core/overview.md); no core changes needed; `getLevel()` hook propagates automatically.
- [`J-HUD`](../../../hud/core/overview.md)
  ([Party](../../../hud/ext/party/overview.md)/[Target](../../../hud/ext/target/overview.md)); sync indicator shown
  beside level text when active.

## Activation

Content sync is activated in one of two ways:

1. PLUGIN COMMAND (recommended — session-scoped):
   Use "[Set Content Sync](commands/set-content-sync.md)" at a dungeon entrance event. The session persists across map
   transfers until "[Clear Content Sync](commands/clear-content-sync.md)" is called explicitly. Session always takes
   priority over map notes.
2. MAP NOTE TAG (convenience — map-scoped):
   Add [`<levelSync:N>`](notetags/content-sync.md) to a map's note field. Sync activates on map setup and clears
   automatically when leaving a map without the tag (provided no session is active). Map notes are ignored when a
   session is running.

## Sync modes

### Cap-only (default)

- Real level 90 in a level-50 zone → fights as 50.
- Real level 30 in a level-50 zone → fights as 30 (unchanged).

### Uplevel (exact sync, opt-in)

- Real level 90 in a level-50 zone → fights as 50.
- Real level 30 in a level-50 zone → fights as 50 (boosted).

## What sync affects

### YES (uses effective/synced level)

- `getLevel()` / `actor.level` / `actor.lvl` while encapsulated
- Class `paramBase` curve (already reads `getLevel()`)
- `LevelScaling` combat and reward multipliers
- Formula evaluation using `a.level`
- HUD level display (with sync icon)
- `J-APT` level-difference gate (actor side)

### NO (explicitly unchanged)

- Saved `_level` and EXP (never mutated)
- Equipment flat stats (`paramPlus`)
- Learned skill list
- Permanent `J-Natural` growth from real level-ups
- SDP panel investment
- EXP rewards (by default — see [Sync Affects EXP](parameters/sync-affects-exp.md) parameter)

## EXP behavior

By default ([Sync Affects EXP](parameters/sync-affects-exp.md) = false), EXP rewards use the actor's real level. This
preserves `J-Level-Flat`'s "too high = no EXP" design: a real level-90 actor synced to 50 still earns zero EXP from
level-50 enemies because the EXP calculation sees level 90, not 50.

Set Sync Affects EXP = true to use effective level for EXP. Actors synced down to 50 would then earn EXP as if they are
level 50.

## Session priority

An active session (set by plugin command) is never overridden or cancelled by a map note — even if the map has no sync
tag, or has a different level. Only the "[Clear Content Sync](commands/clear-content-sync.md)" plugin command ends a
session.

Typical pattern for a multi-map dungeon:

- Entrance NPC event: call "[Set Content Sync](commands/set-content-sync.md)" (level=50, uplevel=false)
- Exit crystal event: call "[Clear Content Sync](commands/clear-content-sync.md)"
- Inner maps do not need any tags