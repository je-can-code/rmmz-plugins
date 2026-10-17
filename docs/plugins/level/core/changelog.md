---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.6.4
  - Max TP from a growth curve is now the base that other bonuses build on.
### 1.6.3
  - Routed the growth-curve formula error through J-Base's new Diagnostics, so it names J-LevelMaster in the console.
### 1.6.2
  - Repointed the skill-learned announcement at J-Log's new $mapLogs registry. The $diaLogManager global this called is
    gone. Requires J-Log 3.0.0 when J-Log is installed at all.
### 1.6.1
  - Fixed the level scaling band being read as a single point below parity, so battlers at equal levels dealt a bonus
    instead of no bonus at all.
### 1.6.0
  - Routed the _level namespace into its own save section, so level state lands in systems/level.json rather than inside
    the system blob.
  - Moved the _level namespace seeding from the initialize alias to initMembers, so a decoded save can establish it
    without a constructor.
### 1.5.0
  - Learning a skill by levelling now announces in the dia log instead of only producing a floating text pop on the same
    visual channel as damage numbers and gold. backfillLearningsForCurrentLevel is explicitly safe to call repeatedly,
    so it snapshots prior knowledge and does not re-announce an actor's whole class list on every class change.
### 1.4.0
  - Added Single Level Across Classes: actors can now share one level/exp across all classes instead of leveling each
    class independently, with a class-independent canonical exp curve and retroactive learning backfill on class change.
  - Added per-class growth curve tags (<mhpGrowthCurve>, etc. for all base params plus <mtpGrowthCurve>) as authored,
    formula-driven replacements for the slope-extrapolation fallback beyond level 99. MTP's curve is evaluated live at
    every level, not just beyond 99, since MTP has no baked params[] array to defer to below the cap.
### 1.3.1
  - Updated battler name rendering support for compatibility.
### 1.3.0
  - Added reward-specific min/max multipliers; LevelScaling.multiplier accepts combat vs reward scope.
### 1.2.1
  - Fixed issue with level overrides not apply J-NATURAL growths.
### 1.2.0
  - Added ability to override JABS enemies on the map with a new level.
### 1.1.1
  - Added ability to manipulate max level for actors.
  - Adapted extended plugin metadata structure.
### 1.1.0
  - Refactored various data retrieval methods from given battlers.
  - Fixed issue with mismapped level calculations.
  - Added more jsdocs and comments to explain better the logical flow.
  - Removed useless methods.
  - Updated example battle scenario to be more verbose.
### 1.0.0
  - The initial release.