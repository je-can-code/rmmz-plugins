---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.4.0
  - Player interference is now resolved by the shared resolver in J-HUD instead of by this frame's own test against the
    player's screen position, which had this frame's corner written into it.
### 1.3.1
  - Fixed boot and load failures left behind by the quick menu pare-down: Scene_Map#createJabsAbsMenu still called the
    six create-window methods that went with the removed assignment flows, so loading any save crashed before the map
    finished building. The quick menu has one window left.
### 1.3.0
  - Leader affliction rendering now delegates to J-HUD core's shared
    StateAfflictionHudPresenter/StateAfflictionHudLayoutSpec instead of a duplicated local implementation (removed ~300
    lines of local code).
  - Window backdrop opacity default changed from 32 to fully transparent (0).
### 1.2.0
  - Integrated J-ABS-Shields; supports display for shield gauge.
  - Updated many classes to use modern class syntax.
  - Updated visuals for clarity across many aspects of the HUD.
### 1.1.0
  - Added visual tracking indicator for "in combat" for the leader.
  - Retroactively added this changelog.
### 1.0.0
  - Initial release.