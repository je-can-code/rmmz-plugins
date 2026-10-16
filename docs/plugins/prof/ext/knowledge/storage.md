---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [prof-knowledge, save, data]
---

# Storage

This plugin will add the `_proficiency` namespace to the party to hold the knowledge it has banked.

## Parent

The party.

## Addition

The `_proficiency` namespace.

## Save Section

None of its own. `_proficiency` is the namespace `J-Proficiency` routes into its `proficiency` section when
`J-Base-Save` is installed, so the party's slice is written there beside the actors'. Without it, the namespace saves
inline with the party in the normal save.