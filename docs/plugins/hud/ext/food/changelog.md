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
  - The food frame fades while the player is standing on top of it, through the shared resolver in J-HUD.
### 1.0.2
  - Corrected PLUGIN_NAME from J-HUD-FOOD to J-HUD-Food, matching the name the ship has always been built and shipped
    under.
### 1.0.1
  - The food frame no longer declares private members. A window's constructor reaches initialize, and through it the
    drawing hooks, before a derived class installs its own members- so anything private was being touched on an object
    that did not yet have it.
### 1.0.0
  - Initial release.