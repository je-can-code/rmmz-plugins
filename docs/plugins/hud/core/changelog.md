---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.4.0
  - Afflictions can now sit on one shared row of smaller icons, each on a colored square that marks it a buff or a
    debuff, for frames that are short on room.
### 2.3.0
  - Added HudInterferenceResolver, which decides how far a frame fades while the player is standing on top of it. The
    geometry belongs to the family rather than to any one frame: each used to carry its own inequality against the
    player's screen position, which encoded that frame's corner and went quietly wrong the moment somebody moved it.
### 2.2.0
  - Routed the _hud namespace into its own save section, so HUD state lands in systems/hud.json rather than inside the
    system blob.
  - Moved the _hud namespace seeding from the initialize alias to initMembers, so a decoded save can establish it
    without running a constructor.
  - Fixed four broken import paths in the state affliction presenter's tests that resolved outside the repository
    entirely.
### 2.1.0
  - Added a dual-row (negative/positive) state affliction presenter to the party HUD frame- icons, timers, and stack
    counts, sprite-cached per battler and cleaned up on target switch.
  - Added an explicit J-ABS 4.0.0+ version requirement check at boot.
  - Fixed a self-referencing @base/@orderAfter J-HUD declaration on this plugin's own header.