---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [regions-skills, save, data]
---

# Storage

This plugin will add the `_skills` namespace to the map, the player, the followers, and the vehicles, inside the
`_regions` namespace `J-RegionEffects` keeps on them, to hold its region skill data. Map events carry it too, but an
event's `_j` is never written to a savefile.

## Parent

- The map, inside its `_regions` namespace.
- The player, inside its `_regions` namespace.
- The followers, inside their `_regions` namespace.
- The vehicles, inside their `_regions` namespace.

## Addition

The `_skills` namespace.

## Save Section

None of its own. The namespace lives inside `J-RegionEffects`'s `_regions` namespace, so it saves in
`J-RegionEffects`'s `regions` section when `J-Base-Save` is installed. Without it, the namespace saves inline with each
parent in the normal save.