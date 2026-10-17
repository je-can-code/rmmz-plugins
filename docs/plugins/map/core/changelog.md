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
  - BREAKING: <areaEvent:WxH> is no longer read here. Teleport markers stretch across J-Pixelistics' <areaEvent:[W, H]>
    instead.
### 1.2.2
  - Minimap walls follow the engine's passability instead of the tileset's flags.
### 1.2.1
  - Corrected PLUGIN_NAME from J-MAP to J-Map, matching the name the ship has always been built and shipped under.
### 1.2.0
  - Routed the _map namespace into its own save section, so minimap state lands in systems/map.json rather than inside
    the system blob.
### 1.1.0
  - Added an orange-diamond minimap marker for inanimate JABS enemies (pots, crates), distinct from the red-diamond
    hostile marker.
  - Added <minimap:teleport>/<mm:teleport> markers (hollow light-blue square), stretchable to a multi-tile zone via
    <areaEvent:WxH>.
  - Added quest markers (questOffer/questProgress/questTurnIn) for Omni-Quest integration.
  - Added <blockMinimap> to suppress the minimap outright on a given map.
### 1.0.2
  - Adapted for updates to J-ABS-InputManager (input namespace).
### 1.0.1
  - Adds support for JABS-based input remapping.
  - Removes connection between TIME system and minimap visibility.
### 1.0.0
  - The initial release.