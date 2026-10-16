---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.5.1
  - Adapted to the RPGManager array read signature.
### 1.5.0
  - Routed the _sks namespace into its own save section, so equipped skill slots land in systems/sks.json rather than
    inside the actor blobs.
### 1.4.0
  - Retrofitted the skill equip scene onto the shared actor skeleton, so it matches the other actor-scoped scenes.
  - Command windows now seed state in initMembers, early enough for makeCommandList to see it.
### 1.3.0
  - Added per-battler unslotted-skill exemptions via <unslottedSkills:[...]>.
  - Stale slot entries are now automatically cleared when the actor no longer knows the skill occupying them.
### 1.2.0
  - Added Exclusive Mode, letting slot count or slot points alone gate equipping instead of requiring both. Enforced
    slot count as a real limit on equipping rather than a display-only limit in the equip scene.
### 1.1.0
  - Promoted maxSlots and maxSlotPoints to independent, notetag-driven stats.
  - Removed the mod-slot-points-party plugin command.
### 1.0.0
  - The initial release.