---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.0.0
  - Removed `eventId` from participants. They now spawn from J-ABS's enemy clone map onto their `x` and `y`.
  - Added `template`, `bystander` and `summoned` to participants.
  - Added `defeatSwitch`, turned on once the fight is won on its own `map`, and `JabsBossManager.isBossDefeated()`.
  - Added reactions, which fire once per fight when it starts, when named participants fall, or at a health percent.
  - Added `dormant` routines, and the `participant` step field for acting on any participant.
  - Added the addState, removeState, changeImage, quickenRoutine, spawn, tint, animation, dialogue, blink, wait,
    learnSkill, startRoutine, face, log, summon and jump verbs.
  - Participants are immune to knockback while their fight runs.
  - Routines now count only fight time, waiting while an event is running or a message is open.
  - Spawned bodies and bystanders leave the map with the fight, and ending a fight restores the screen tint.
  - Leaving the map now ends the encounter, and a new game or loaded save forgets it.
  - A step's `expect` can now be left out to skip its drift check.
  - Starting an encounter now fails on a misconfigured participant, reaction, routine or step, or a body that fails
    to spawn.
  - Fixed bug with a boss held in place never casting a forced skill.
  - Fixed bug with forced casts never landing while the boss stood beyond J-ABS's AI range.
  - Requires J-Base 4.4.0 and J-ABS 4.29.0.
### 1.0.1
  - The plugin metadata class no longer declares private members. Its base constructor reaches postInitialize before a
    derived class installs its own, so anything private was being touched on an object that did not yet have it, which
    threw during boot.
### 1.0.0
  - The initial release.