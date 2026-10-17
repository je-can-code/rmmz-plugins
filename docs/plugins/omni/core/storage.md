---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [omni, save, data]
---

# Storage

This plugin saves no data of its own. It owns the `_omni` namespace that the omnipedia extensions keep their data in,
and it routes that namespace into a save section of its own.

## Parent

- The party.
- The map.

## Addition

The `_omni` namespace, which each omnipedia extension adds to its parent and fills with its own data. This plugin writes
nothing into it.

## Save Section

`omni` (the file `systems/omni.json`), when `J-Base-Save` is installed. Without it, the namespace saves inline with each
parent in the normal save.