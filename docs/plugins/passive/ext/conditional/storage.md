---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [passive-conditional, save, data]
---

# Storage

This plugin will add the `_conditional` namespace to every battler, inside the `_passive` namespace `J-Passive` keeps on
them, to hold its passive rule tracking. Only actors reach a savefile.

## Parent

- All actors, inside their `_passive` namespace.

## Addition

The `_conditional` namespace.

## Save Section

None of its own. The namespace lives inside `J-Passive`'s `_passive` namespace, so it saves in `J-Passive`'s `passive`
section when `J-Base-Save` is installed. Without it, the namespace saves inline with each actor in the normal save.