---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.1.2
  - The charge gauge now hangs off the character overlay, so it keeps its own size and stays put through whatever the
    battler beneath it is animating.
### 1.1.1
  - Adapted to the RPGManager array read signature.
### 1.1.0
  - Added a segmented map charge gauge shown above charging battlers.
  - Registered <chargeTier> as a J-Extend non-combining key.
  - Charging input now also treats channeling as busy (J-ABS Channel). canChargeSlot now requires an affordable release
    skill on some tier.
  - Guard skills can now be charged from the offhand slot.
  - Added per-slot charge input delay timers for hold-to-charge skills.
  - Fixed getHighestChargedTier crashing when no tier was completed.
  - Fixed switch-slot-to-charge logic, which never actually fired.
### 1.0.4
  - Raised minimum J-ABS version requirement to 4.7.0.
### 1.0.3
  - Raised minimum J-ABS version requirement to 4.6.0.
### 1.0.2
  - Consumed `RPGManager` update.
### 1.0.1
  - Updated to accommodate changes in J-ABS-InputManager.
### 1.0.0
  - Initial release.