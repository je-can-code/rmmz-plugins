---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [level, save, data]
---

# Storage

This plugin will add the `_level` namespace to the actors and the events on the map to hold its level data, and the
`_levelScalingEnabled` flag to the system to hold whether level scaling is enabled.

## Parent

- All actors.
- The events on the map.
- The system, for the `_levelScalingEnabled` flag.

## Addition

The `_level` namespace, and the `_levelScalingEnabled` flag.

## Save Section

`level`, when `J-Base-Save` is installed. Without it, the namespace saves inline with each parent in the normal save.
`J-Base-Save` treats everything under an event's `_j` as map-session state and never writes it, so the events'
namespace is not saved at all when it is installed.
The `_levelScalingEnabled` flag sits outside the namespace, so it always saves inline with the system.