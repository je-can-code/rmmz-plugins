---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [pixel, overview]
---

# Overview

This plugin is `J-Pixelistics`: pixel-accurate movement for RPG Maker MZ.

It replaces the default tile-locked movement with a fractional-coordinate system, allowing characters to occupy any
point within the map rather than only the center of a tile. Sub-tile collision is handled via a subcell table built from
the engine's own tile passability data.

All J-plugins that provide optional integration with this plugin (such as [`J-ABS-Pixelistics`](../ext/abs/overview.md)
for JABS combat support) load after this plugin.

## Details

Characters move in fractional tile units each frame (e.g. 0.15 tiles). A subcell collision table
(`PIXEL_CollisionManager`) is built on each map load, dividing every tile into a configurable number of subcells
(default 4x4).

Collision is resolved by checking subcell edge crossings in the direction of travel, using directional passability codes
derived from the tileset.

JABS integration (ally AI formation, smart battler movement, action distance scaling, etc.) is handled by the separate
[`J-ABS-Pixelistics`](../ext/abs/overview.md) extension, which must be loaded after this plugin.

## Layering

The source for this plugin is organized as follows:

- `src/plugins/pixel/core` — this plugin (engine-facing movement)
- `src/plugins/pixel/ext/abs` — JABS bridge (loads after `J-ABS` + this)