---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.0.1
  - Fixed requiring J-ABS; its version check now only runs when J-ABS is installed.
### 2.0.0
  - Removed the main-menu Aptitude command and its menu-switch parameter.
  - Teachings list cheapest first, and AP takes its name and icon from the managers.
### 1.5.0
  - Added natural growth tags for aptitude rate (apr).
### 1.4.0
  - Updated the code so the name where an aptitude gain came from is possible.
### 1.3.2
  - Repointed AP gain and aptitude-growth logging at J-Log's new $mapLogs registry.
### 1.3.1
  - Fixed an aptitude multiplier of zero awarding the full unscaled amount.
### 1.3.0
  - Routed the `_aptitude` namespace into its own save section.
### 1.2.0
  - Learning a skill through an aptitude now announces in the dia log.
  - Retrofitted the `Scene_Aptitude` onto the shared actor skeleton.
  - The actor ribbon is now one row tall and no longer teaches controls.
  - Fixed an accessor calling itself rather than assigning its field.
  - Command windows now seed state in initMembers, early enough for `makeCommandList()` to see it.
### 1.1.0
  - Added AP rate multiplier via `<aptMultiplier:AMOUNT>`.
  - J-LevelMaster integration is now an all-or-nothing gate on AP gain.
  - Fixed stale requiredAp.
  - Added refresh-required-ap / refresh-required-ap-all plugin commands.
### 1.0.3
  - Raised minimum J-ABS version requirement to 4.6.0.
### 1.0.2
  - Updated to be more extensible for extensions.
  - Fixed parsing inputs for aptitude progresses.
### 1.0.1
  - Added emergency initialization for existing saves.
### 1.0.0
  - The initial release.