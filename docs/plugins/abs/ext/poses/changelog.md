---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.0.7
  - Removed the commented-out warnings for a missing pose sheet, and said in a comment why the branch stays silent: it
    runs on every execution of the skill, so a report would repeat for as long as the asset is absent.
### 1.0.6
  - Fixed a skill with no pose building a sprite name ending in undefined; the absent tag answered an empty array, which
    is truthy.
### 1.0.5
  - startGuarding no longer takes a skillSlot param, matching J-ABS core; the guard pose now resolves via
    getGuardSkillId() instead.
  - Moved gameAssetExists from its own file into initialization.js.
  - Removed leftover unused scaffold plugin params.
### 1.0.4
  - `JABS_Battler` pose hooks aligned with J-ABS 4.10.0 dodge/guard battler updates.
### 1.0.3
  - Raised minimum J-ABS version requirement to 4.7.0.
### 1.0.2
  - Raised minimum J-ABS version requirement to 4.6.0.
### 1.0.1
  - Consumed `RPGManager` update.
### 1.0.0
  - The initial release.