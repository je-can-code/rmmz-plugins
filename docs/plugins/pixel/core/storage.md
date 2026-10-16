---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [pixel, save, data]
---

# Storage

This plugin will add the `_pixel` namespace to the player, the followers, and the vehicles to hold its pixel movement
data.

## Parent

- The player.
- All followers.
- All vehicles.

Map events carry the namespace too while a map is loaded, but `J-Base-Save` never writes it for them.

## Addition

The `_pixel` namespace.

## Save Section

`pixel`, when `J-Base-Save` is installed. Without it, the namespace saves inline with each parent in the normal save.