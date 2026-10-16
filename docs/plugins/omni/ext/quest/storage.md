---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [omni-quest, save, data]
---

# Storage

This plugin will add the `_omni` namespace to the party, to hold the quests and their progress, and the `_quest`
namespace inside the `_omni` namespace of the map, for its runtime tracking.

## Parent

- The party.
- The map, inside its `_omni` namespace.

## Addition

The `_omni` namespace on the party, which this plugin shares with `J-Omnipedia` and the other omnipedia extensions, and
the `_quest` namespace on the map.

## Save Section

None of its own. Both live inside [`J-Omnipedia`](../../core/storage.md)'s `_omni` namespace, so they save in that
plugin's `omni` section when `J-Base-Save` is installed. Without it, they save inline with each parent in the normal
save.