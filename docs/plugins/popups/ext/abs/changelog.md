---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.3.1
  - Cleaned up the popup guards that the passive-refresh ordering fix in J-Passive made redundant.
### 1.3.0
  - Per-target strike/slip aggregates (no per-attacker lanes); combat slip/reward/mitigation merge buckets +
    idle/combo/map flush hooks; requires J-Popups v2.1.0+ merge stack (`Sprite_MapDamage`, merge controller).
  - `mergeIdleFlushFrames` is one sliding window per target (all merge kinds refresh it); strike release does not listen
    on `ComboChainCleared` (avoids global flush from other battlers' cooldowns).
  - Added <noHpPopup>/<noMpPopup>/<noTpPopup>/<noSlipPopup> state tags to suppress slip/regen popups per-resource or
    entirely.
  - Added configurable outline width plugin params for harm vs heal combat damage numbers
    (damageOutlineWidth/healingOutlineWidth).
### 1.2.0
  - Plugin parameter disableSkillUsedPopups suppresses caster skill-name popups only.
### 1.1.0
  - Extracted popup construction into a dedicated JABS_PopupManager class.
  - Added ABS-specific TextPopBuilder and Map_TextPop extensions in _models/.
  - Renamed source files to standard JABS naming conventions.
### 1.0.0
  - Initial release.