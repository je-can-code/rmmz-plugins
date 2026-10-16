---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [abs-speed, save, data]
---

# Storage

This plugin will add the `_speed` namespace to every battler, inside the `_abs` namespace `J-ABS` keeps on them, to
hold its cached movement speed boost. Only actors reach a savefile.

## Parent

- All actors, inside their `_abs` namespace.

## Addition

The `_speed` namespace.

## Save Section

None of its own. The namespace lives inside `J-ABS`'s `_abs` namespace, so it saves in `J-ABS`'s `abs` section when
`J-Base-Save` is installed. Without it, the namespace saves inline with each actor in the normal save.