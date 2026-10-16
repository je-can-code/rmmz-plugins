---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.2.0
  - Added natural growth tags for move speed boost (msb).
### 1.1.1
  - Corrected PLUGIN_NAME from J-ABS-SpeedBoosts to J-ABS-Speed, matching the name the ship has always been built and
    shipped under.
### 1.1.0
  - Move speed boost (msb) registered with the shared parameter catalog and given an SDP panel binding, so it can now be
    invested via SDP.
  - Replaced getWalkSpeedBoosts() with a plain msb getter, matching the catalog's getValue(battler => battler.msb)
    convention.
  - Removed the legacy IconManager.longParam(31) override in favor of catalog-driven icon resolution.
### 1.0.3
  - Raised minimum J-ABS version requirement to 4.7.0.
### 1.0.2
  - Raised minimum J-ABS version requirement to 4.6.0.
### 1.0.1
  - Consumed `RPGManager` update.
### 1.0.0
  - Initial release.