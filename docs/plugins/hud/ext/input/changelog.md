---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.3.0
  - Player interference is now resolved by the shared resolver in J-HUD instead of by this frame's own test against the
    player's screen position, which had this frame's corner written into it.
### 1.2.0
  - Cooldown overlay icon: a configurable icon renders over skill slots that are currently on cooldown, making
    unavailability obvious at a glance.
  - Pulse animation: a brief scale pop fires whenever a slot becomes newly available (base cooldown finished or combo
    window opens).
  - Combo expire gauge: the cooldown gauge switches to a warm orange-to-yellow color and counts down the combo expiry
    window while a follow-up is live, then returns to the base cooldown display after the window closes.
### 1.1.2
  - Combo cooldown gauge merges J-ABS global cooldown (GCD) for GCD-subject skill slots (not tool/dodge).
### 1.1.1
  - Wired HP skill cost into Sprite_SkillCost for display on action slots (requires J-Resources).
### 1.1.0
  - Changed input to reflect a switch-view diamond in the center.
  - Retroactively added this changelog.
### 1.0.0
  - Initial release.