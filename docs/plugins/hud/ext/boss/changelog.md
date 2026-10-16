---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.1.0
  - The boss frame now has a wide gauge centered under the boss's name, with its level above and its afflictions below.
    While it is up, the target frame waits beneath it, and never opens for the boss itself.
### 1.0.2
  - Routed the boss-creation failure through J-Base's new Diagnostics, so it names J-HUD-BossFrame in the console.
### 1.0.1
  - Fixed the HP-percent threshold check using a chained comparison (lowerRange <= hpPercent <= upperRange), which does
    not perform a range check in JS and was nearly always true regardless of the boss's actual HP.
### 1.0.0
  - Initial release.