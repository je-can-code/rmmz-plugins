---
type: notetag
title: Block Minimap
description: The map tag that suppresses the minimap outright on that map.
tags: [map, tag, block, minimap]
---

# Block Minimap

## Description

Some maps- like tight indoor corridors, cutscene-only maps, or maps where you simply don't want the minimap distracting
the player- can suppress the minimap outright.

## TAG USAGE

- Maps, in the map's note field.

## TAG FORMAT

`<blockMinimap>`

## TAG EXAMPLES

`<blockMinimap>`
The minimap never renders while the player is on this map, regardless of the plugin's
"[Start Visible](../parameters/start-visible.md)" setting or any toggle command.