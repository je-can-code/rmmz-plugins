---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [map, overview]
---

# Overview

This plugin renders a minimap onto the map.

## Integrations

Integrates with others of mine plugins:

- [`J-Base`](../../_base/core/overview.md); to be honest this is just required for all my plugins.
- [`J-ABS`](../../abs/core/overview.md); reveals battlers on the map.
- [`J-HUD`](../../hud/core/overview.md); respects "should hide HUD" logic.
- [`J-TIME`](../../time/core/overview.md); visibility syncs with TIME window if available.

## Details

The minimap will render the player, your followers, and if using JABS, it'll also render enemy battlers and any dropped
loot.

You can use the plugin commands to toggle minimap visibility.

## Plugin parameters

- [Minimap X](parameters/minimap-x.md): Represents the X coordinate this will be rendered at by default. -1 = will
  automatically show up at the bottom right.
- [Minimap Y](parameters/minimap-y.md): Represents the Y coordinate this will be rendered at by default. -1 = will
  automatically show up at the bottom right.
- [Start Visible](parameters/start-visible.md): Whether or not this minimap should be rendered when a game is started.
  This state is false by default, and is not persisted into game state.
- [Respect JABS HUD Visibility](parameters/respect-hud-hide.md): Whether or not to sync the show/hide toggling with the
  rest of the JABS HUD elements.
- [Overlap Opacity %](parameters/overlap-opacity-percent.md): The opacity to switch to when the player overlaps with the
  minimap.

## Plugin commands

- [Toggle Minimap](commands/toggle-minimap.md): Choose to show/hide the minimap on-demand.

## Teleport zone size

A teleport marker covers exactly the tiles its event does. Most events cover a single tile, but with
[`J-Pixelistics`](../../pixel/core/overview.md) a page can cover a whole rectangle through
[`<areaEvent:[WIDTH, HEIGHT]>`](../../pixel/core/notetags/area-event.md), and the marker stretches across all of it with
no tag of this plugin's own.

### Tag examples

`<areaEvent:[3, 2]>`
This teleport event's minimap marker is stretched to a 3-wide by 2-tall hollow square instead of a single tile. See
[`J-Pixelistics`' help](../../pixel/core/notetags/area-event.md) for the tag itself.