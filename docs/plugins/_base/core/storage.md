---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [base, save, data]
---

# Storage

This plugin will add the `_base` namespace to every battler, to hold what it caches about the battler's notes, traits
and equipment. Only actors reach a savefile.

## Parent

- All actors.

## Addition

The `_base` namespace.

## Save Section

None of its own. The namespace saves inline with each actor in the normal save. When `J-Base-Save` is installed,
everything in it is left out of the file and rebuilt after loading.