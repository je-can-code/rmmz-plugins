---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.1.0
  - A target name too long for the frame shrinks to fit.
### 2.0.0
  - The target frame no longer needs gauge images. Its gauges draw like the rest of the HUD's, trail and all, its
    afflictions share one compact row, and icons now lead the target's name. The image gauge parameters are gone.
### 1.2.0
  - The target frame fades while the player is standing on top of it, through the shared resolver in J-HUD. This rides
    on top of the inactivity fade rather than competing with it - that one owns opacity, this one owns alpha.
### 1.1.0
  - Target frame now renders the shared dual-row state affliction presenter from J-HUD core, wired via a new patch file.
  - Fixed Game_Enemy#targetFrameIcon reading with the TargetFrameText regex instead of TargetFrameIcon, so the icon tag
    never matched.
### 1.0.1
  - Adjusted target frame defaults for better readability.
  - Improved gauge alignment logic for consistent HP/MP positioning.
### 1.0.0
  - Initial release.