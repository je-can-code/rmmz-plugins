---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.2.1
  - AP gain messages take AP's name from TextManager.
### 1.2.0
  - Enemy typing reads prefixed elements (vs , x , tool-) from the weakness side and standard elements from the
    resistance side, since a prefix marks an element as describing what a battler is rather than what hurts it. The rate
    arithmetic moved to RPG_BaseBattler so anything can ask what a battler is.
### 1.1.4
  - The aggregate details window names its aptitude sources.
### 1.1.3
  - Routed the missing-teachable warning through J-Base's new Diagnostics, so it names J-Aptitude-Typed in the console.
### 1.1.2
  - Repointed typed AP gain logging at J-Log's new $mapLogs registry. The $actionLogManager global this called is gone.
    Requires J-Log 3.0.0 when J-Log is installed at all.
### 1.1.1
  - Adapted to the RPGManager array read signature.
### 1.1.0
  - Fixed <apTyped:[AMOUNT, DOMAIN, ID_OR_NAME]> never matching — the regex required a 4th leading numeric field that
    the documented 3-argument format never had.
  - Fixed AptitudeTeachable.js never being imported in entry.js, so setApTypeKey()/apTypeKey() were never actually
    attached.
  - Renamed ApTypeKey.DomainType.WeaponType/SkillType to Weapon/Skill.
  - Replaced the leftover boilerplate plugin description.
### 1.0.0
  - The initial release.