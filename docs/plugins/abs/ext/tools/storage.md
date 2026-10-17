---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [abs-tools, save, data]
---

# Storage

This plugin will add the `_tools` namespace to the system and to the characters on the map to hold its grab-and-throw
state.

## Parent

- The system.
- The characters on the map: the player, followers, vehicles and events.

## Addition

The `_tools` namespace.

## Save Section

`abs-tools`, when `J-Base-Save` is installed. Events are left out of it, since every event is rebuilt at the next map
setup. Without it, the namespace saves inline with each parent in the normal save.