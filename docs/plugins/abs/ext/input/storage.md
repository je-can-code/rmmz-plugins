---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [abs-input, save, data]
---

# Storage

This plugin keeps the player's key bindings out of the savefile. It adds the `jabsInputMappings` and `jabsInputBindings`
fields to the configuration, so with `J-Base-Save` installed they are written to `config.json` beside the volume
settings and apply to every save.

## Parent

- The configuration (`ConfigManager`), which belongs to the installation rather than to any save.

## Addition

The `jabsInputMappings` and `jabsInputBindings` fields.

## Save Section

None of its own. `J-Base-Save` writes both fields into `config.json`, the installation's configuration document, when it
is installed. Without it, `ConfigManager` has nowhere to write them, and they last only for the running session.

## Reading them back

The stored bindings are laid over the defaults rather than replacing them. A configuration is only as new as the build
that wrote it, so an input added to the plugin afterward is missing from it; that input arrives at its default, while
every binding the player did set, an unbound one included, is kept as they left it.