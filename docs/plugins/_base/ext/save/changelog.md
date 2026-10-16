---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.0.3
  - Routed the generation-fallback and dropped-slice warnings through J-Base's new Diagnostics, replacing the
    hand-written "[save]" prefix so these read the same as every other plugin's console output.
### 1.0.2
  - Declared the equipment-contribution cache J-Base added to Game_Actor as transient. It holds a Map, which is a
    registered type, so left undeclared it would have persisted into every savefile and come back stale after a load
    rather than being rebuilt from what is currently equipped.
### 1.0.1
  - The retainedSaveGenerations parameter is now read as a number rather than as the string RMMZ hands over, so a
    configured value survives arithmetic and not only comparisons that happen to coerce.
### 1.0.0
  - The initial release.
  - Added Scene_Files, one scene for saving, loading, deleting and rewinding, replacing Scene_Save and Scene_Load. What
    it offers is decided by where it was opened from and never by $gameSystem, since save access persists into savefiles
    and would leak.
  - Added Rewind, which loads one named generation of the slot being played with no fallback to a newer one, and deletes
    nothing doing it.
  - Added Delete, offered only from the title screen.
  - Saving now writes a snapshot.jpg beside the sections, cropped from the map capture the menu backdrop already takes.
    It is absent from the manifest's section list on purpose, so losing it cannot fail a generation. maxSavefiles now
    answers with the number of slots the scene renders, so New Game can no longer claim a slot the scene never draws.
  - The menu's save command became a Files command, ungated by save access.