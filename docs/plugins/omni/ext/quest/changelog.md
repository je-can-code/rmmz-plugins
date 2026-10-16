---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.0.4
  - Renamed the declared dependency on J-MessageTextCodes to J-Message, which is what that plugin's file is called now.
### 2.0.3
  - Fixed quest choice conditionals not hiding branches inside called common events. Dropped the dead commonEventId
    accessor.
### 2.0.2
  - Routed every quest and objective warning and error through J-Base's new Diagnostics, so each names J-OMNI-Quests.
    Removed the console.log lines narrating category changes, tracking toggles, index moves, quest additions and no-op
    state refreshes; none reported a fault.
### 2.0.1
  - Repointed quest and objective update announcements at J-Log's new $mapLogs registry. The $diaLogManager global these
    called is gone.
  - Requires J-Log 3.0.0 when J-Log is installed at all.
### 2.0.0
  - Renamed from J-Omni-Questopedia to J-OMNI-Quests. The shipped file is renamed with it, so an existing plugins.js
    entry must be updated or the plugin will simply not load.
### 1.2.2
  - Removed two console logs left over from testing.
### 1.2.1
  - The questopedia description window no longer declares private members. A window's constructor reaches initialize,
    and through it the drawing hooks, before a derived class installs its own members- so anything private was being
    touched on an object that did not yet have it.
### 1.2.0
  - The questopedia lookup cache is no longer written to savefiles. It held the same entries as the saveables it is
    built from, keyed for lookup, which made it the single largest thing in a savefile - 44,109 characters in a real
    one. It now rebuilds from the saveables on load.
  - The destination timer is no longer written either; the map gets a fresh one, since it measures nothing the player
    can observe.
### 1.1.0
  - Added <pageQuestCondition>/<choiceQuestCondition>, gating an event page or a single "Show Choices" branch behind
    quest/objective state (active quest, active objective, or a specific objective STATE:
    inactive/active/completed/failed/missed).
### 1.0.3
  - Updated to accommodate for mapping shortcut to view quest log.
  - Added flag for showing external file load info.
### 1.0.2
  - Adapted for updates to J-ABS-InputManager (input namespace).
### 1.0.1
  - Adds support for JABS-based input remapping.
### 1.0.0
  - The initial release.