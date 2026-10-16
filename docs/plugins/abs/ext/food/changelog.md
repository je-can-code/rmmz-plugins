---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.0.0
  - Food chains gained a second type, an alternative to healing.
  - Retired Overstuffed along with it: <overstuffedImpervious> is gone, replaced by <foodChainImpervious>, and
    <endFoodChain> now closes a chain outright.
### 1.1.0
  - The Well Fed entry state names the leader as its source, so it applies as a JABS state and its expiry advances the
    chain. Without one it landed as an inert vanilla state that never expired, and the arc never started.
  - An item declaring a food group nothing registered now warns and names the groups that do exist, rather than being
    eaten to no effect in silence.
### 1.0.3
  - Routed the missing-duration authoring warning through J-Base's new Diagnostics, so it names J-ABS-Food in the
    console rather than the J-ABS-FOOD spelling this ship never actually shipped under.
### 1.0.2
  - Repointed the last-item-consumed log at J-Log's new $mapLogs registry.
  - The $lootLogManager global this called is gone. Requires J-Log 3.0.0 when J-Log is installed at all.
### 1.0.1
  - Corrected PLUGIN_NAME from J-ABS-FOOD to J-ABS-Food, matching the name the ship has always been built and shipped
    under.
### 1.0.0
  - Initial release.