---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 3.1.0
  - Its buff and growth tags are described in words, and a negative rate stops a parameter at 0.
### 3.0.0
  - Any plugin can now bind natural growth to its own parameters, and plugin order no longer matters. Every tag is
    written in the numbers the status screen shows. Growth accumulated in older saves does not carry over.
  - Fixed ex- and sp-parameter growth delivering a hundredth of its value, and healing rate buffs landing as raw amounts
    rather than percents.
  - Removed the per-parameter growth accessors and applyNaturalCustomGrowths; plugins bind their parameters through
    J-Base's registry instead.
### 2.4.1
  - Routed the unrecognized-subclass warning through J-Base's new Diagnostics, so it names J-NaturalGrowth in the
    console.
### 2.4.0
  - Routed the _natural namespace into its own save section, so accumulated growth lands in systems/natural.json rather
    than in the system blob.
### 2.3.0
  - BREAKING (tag semantics): ex- and sp-parameter growth tags now take whole percents, matching the buff tags beside
    them. The growth path stored its flat bonus raw while the buff path divided by 100, so the same value in the two
    families differed by a factor of one hundred on any parameter the engine keeps as a 0-1 fraction: <hitBuffPlus:[5]>
    meant five percent hit while <hitGrowthPlus:[5]> meant five hundred, applied per level. Base parameters and max TP
    are untouched, since those are whole numbers where a tag of ten has always meant ten points.
### 2.2.0
  - Added HAR (Healing Rate) growth and buff support — not a native param array member, so it gets its own dedicated tag
    set like max tp: <harGrowthPlus:[FORMULA]>, <harGrowthRate:[FORMULA]>, <harBuffPlus:[FORMULA]>,
    <harBuffRate:[FORMULA]>. Growth applies via the existing applyNaturalCustomGrowths hook (actors only); buffs apply
    to both actors and enemies. Requires J-Base 3.2.0+.
### 2.1.2
  - Fixed issue with broken regex structures for max TP.
  - Consumed `RPGManager` updates.
### 2.1.1
  - Relocates basic max TP management to the J.BASE plugin.
  - Adds ability to also add a bonus to SDP dropped.
### 2.1.0
  - Added formula evaluation for enemy rewards on enemies.
### 2.0.1
  - Fixed issue with buffs not being refreshed in Scene_Equip.
### 2.0.0
  - Buff tracking has been refactored to be more compatible with J-Passives.
  - Fixed issues with buffs/growths not being tracked correctly.
### 1.0.0
  - Initial release.