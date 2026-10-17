---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 3.0.3
  - EXP, SDP, AP and gold take their names from TextManager.
### 3.0.2
  - Renamed the declared dependency on J-MessageTextCodes to J-Message, which is what that plugin's file is called now.
    Left as it was, the base declaration named a plugin no project would have installed.
### 3.0.1
  - Routed the non-array DiaLog warning through J-Base's new Diagnostics. That channel is for developer console output
    and is unrelated to the log windows this plugin draws for the player.
### 3.0.0
  - BREAKING: the three log manager globals are gone. $actionLogManager, $diaLogManager and $lootLogManager are replaced
    by a single $mapLogs registry that owns all three channels: $mapLogs.action, $mapLogs.dialog and $mapLogs.loot. Any
    code calling the old names must be updated.
  - The three feeds are still three separate managers with their own capacities and their own windows; only the
    bootstrap changed, from three top-level globals for one service down to one.
### 2.2.3
  - Fixed Scene_Map's loot log window accessors reading and writing this._j._log._diaLog. Since createAllWindows builds
    the dia log first, the loot log clobbered its tracker and getDiaLogWindow returned the wrong window entirely.
    Nothing called the three accessors yet, so this never surfaced in play; it was a landmine for the next caller. The
    missing _lootLog property is now declared alongside its siblings.
### 2.2.2
  - Added ActionLogBuilder#setupStatePurged, a log message for a state being removed via J-ABS's new <purgeStates> tag.
### 2.2.1
  - Added SDP drop-related logging.
### 2.2.0
  - Added DiaLog functionality, enabling passive chats to happen on the map.
  - Added Loot Log functionality, where loot-related logs now show up.
  - Refactored around the various log-related classes.
### 2.1.0
  - Refactor the text log manager to use different syntax.
### 2.0.1
  - Small refactor of creation method aliasing.
### 2.0.0
  - Refactored heavily the setup of log window.
### 1.0.0
  - The initial release.