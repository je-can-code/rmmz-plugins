---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [time, save, data]
---

# Storage

This plugin will add the `time` entry to the save contents, to hold the TIME clock (`$gameTime`).

## Parent

- The save contents (`DataManager.makeSaveContents`), as a top-level entry beside the engine's own.

## Addition

The `time` entry, holding the `Game_Time` clock.

## Save Section

None of its own. `time` is not a registered save key, so when `J-Base-Save` is installed it is written into
`world.json`, the fallback section. Without it, the entry saves inline in the normal save.