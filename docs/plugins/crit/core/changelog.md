---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.5.0
  - Its tags are described in words. The base critical reduction now applies and defaults to 0, and SDP critical bonuses
    are no longer 100 times too small.
### 1.4.0
  - critReduction and critReductionBase accept negative values, so a debuff can make critical hits land harder. Fixed
    the Rate variants of the cdm and ctr growth tags.
### 1.3.1
  - The percent factor parser no longer pre-checks for a missing or blank plugin parameter. Such a value stringifies
    into something unparseable, which the finite check below already rejects into the fallback.
### 1.3.0
  - Added <forceCritProcs> to force every on-crit state application roll to succeed, without inflating crit chance or
    touching luck elsewhere.
  - Added conditional crit chance bonuses vs a target's active state, by id
    (<thisCritChanceIfState>/<critChanceIfState>) or by type classifier
    (<thisCritChanceIfStateType>/<critChanceIfStateType>).
  - Added guaranteed crits vs a target's active state, by id (<thisCritsAlwaysIfState>/<critAlwaysIfState>) or by type
    classifier (<thisCritsAlwaysIfStateType>/<critAlwaysIfStateType>); bypasses cev the same way <thisCritsAlways> does.
### 1.2.0
  - Added plugin parameters for the base CDM/CTR defaults (previously a hard-coded, unreachable 50% baked into
    Game_BattlerBase).
### 1.1.0
  - Added on-crit state application tags: <thisCritApply>, <thisCritSelf> (skill-scoped) and <onCritApply>, <onCritSelf>
    (attacker-global, any note source).
### 1.0.2
  - Added dependency note about NaturalGrowth.
  - Added ordering annotation for coming after J-NaturalGrowth.
### 1.0.1
  - Fixed issue where CDM and CDR were not being calculated for SDP bonuses.
### 1.0.0
  - Initial release.