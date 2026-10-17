---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.1.3
  - Fixed saving failing on a map with region states under J-Base-Save.
### 1.1.2
  - Corrected PLUGIN_NAME from J-Region-States to J-Regions-States, matching the name the ship has always been built and
    shipped under.
### 1.1.1
  - Adapted to the RPGManager array read signature.
### 1.1.0
  - Region state step tracking is no longer written to savefiles for the player, followers, or vehicles; it is per-step
    bookkeeping that means nothing across a load, and it now starts fresh.
### 1.0.1
  - Region state application now rolls through the shared on-chance system (lucky/cursed rolls, Accumulate Mode, Encore)
    instead of a flat percent check.
  - Removed a defensive function-existence guard around isVisible(); the method is always present on the contract this
    plugin targets.
### 1.0.0
  - Initial release.