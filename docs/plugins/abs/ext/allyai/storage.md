---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [abs-allyai, save, data]
---

# Storage

This plugin will add the `_allyAi` namespace to every actor and the `_allyAI` namespace to the party, both inside the
`_abs` namespace `J-ABS` keeps on them, to hold each ally's AI and the party-wide ally settings.

## Parent

- All actors, inside their `_abs` namespace.
- The party, inside its `_abs` namespace.

## Addition

The `_allyAi` namespace on actors, and the `_allyAI` namespace on the party.

## Save Section

None of its own. Both namespaces live inside `J-ABS`'s `_abs` namespace, so they save in `J-ABS`'s `abs` section when
`J-Base-Save` is installed. Without it, they save inline with each parent in the normal save.