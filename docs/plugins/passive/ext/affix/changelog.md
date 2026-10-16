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
  - Its tags are described in words. J-Passive-Conditional now draws the timed auto-apply lines in the Passives view.
### 1.2.2
  - Affix tier icons now reach the target frame as icons, so they lead the enemy's name on the rebuilt frame from
    J-HUD-TargetFrame 2.0.0.
### 1.2.1
  - Renamed the declared dependency on J-MessageTextCodes to J-Message, which is what that plugin's file is called now.
### 1.2.0
  - Random affix rolling can be held behind a switch, so a world can stay ordinary until the story says otherwise.
    Affixes written onto an event or an enemy are a statement about that encounter and are applied regardless.
### 1.1.1
  - The tier stripe colour resolver no longer tests for an empty string on top of testing the value itself. String.empty
    is falsy, so the first half of that condition had already answered for both.
### 1.1.0
  - An affix can now be weighted at zero, making it a member of its pool that is never rolled. The state stays
    recognized everywhere else, so an event pinning it explicitly still works - it simply has no presence in the random
    draw until something hands it a weight.
  - Affix pools are now resolved through a pair of methods rather than read straight off the metadata, so an extension
    can bias what a spawn rolls against without re-implementing the spawn.
### 1.0.0
  - Initial release.