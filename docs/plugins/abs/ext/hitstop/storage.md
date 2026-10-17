---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [abs-hitstop, save, data]
---

# Storage

This plugin will add the `_hitstop` namespace to every character on the map, inside the `_abs` namespace `J-ABS` keeps
on them, to hold its hitstop timers.

## Parent

- The characters on the map: the player, followers, vehicles and events, inside their `_abs` namespace.

## Addition

The `_hitstop` namespace.

## Save Section

None of its own. The namespace lives inside `J-ABS`'s `_abs` namespace, so it saves in `J-ABS`'s `abs` section when
`J-Base-Save` is installed. Without it, the namespace saves inline with each character in the normal save.