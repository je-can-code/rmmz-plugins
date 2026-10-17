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
  - Removed the region notetag and the regions-found line it fed. Neither was ever used, and an observation nobody could
    earn only made the entry look incomplete.
### 2.0.0
  - Renamed from J-Omni-Monsterpedia to J-OMNI-Monsters. The shipped file is renamed with it, so an existing plugins.js
    entry must be updated or the plugin will simply not load.
  - Drop observation moved from makeDropItems to J-DropsControl's new postProcessDroppedLoot hook, and deliberately
    reads the incoming list rather than the returned one. What arrives is the loot as this enemy's own rows describe it;
    what leaves may have been promoted up a drop upgrade ladder into rows the enemy never lists. The pedia unmasks drop
    entries by their base ids, so observing the promoted list would credit an entry the enemy does not have and leave
    the real one masked permanently.
### 1.2.1
  - The monsterpedia detail window no longer declares private members. A window's constructor reaches initialize, and
    through it the drawing hooks, before a derived class installs its own members- so anything private was being touched
    on an object that did not yet have it.
### 1.2.0
  - The monsterpedia lookup cache is no longer written to savefiles. It held the same observations as the saveables it
    is built from, keyed by enemy id, which meant every observation the party had ever made was stored twice. It now
    rebuilds from the saveables on load.
### 1.1.0
  - Added <hideFromMonsterpedia>, <monsterFamilyIcon:ICON_INDEX>, and repeatable <descriptionLine:TEXT> Monsterpedia
    entry tags.
### 1.0.2
  - Consumed `RPGManager` updates.
  - Fixed missed issue with SDP rendering.
  - Adjusted monster detail view to accommodate fontsize 24 at 1080p.
### 1.0.1
  - Added support for auto-generating target frame icons where applicable.
### 1.0.0
  - Initial release.