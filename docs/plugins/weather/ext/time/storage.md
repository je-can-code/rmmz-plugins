---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [weather-time, save, data]
---

# Storage

This plugin will add the `_weatherTime` namespace to the system to hold the sky's forecast.

## Parent

- The system.

## Addition

The `_weatherTime` namespace.

## Save Section

None of its own. The namespace stays inline on the system, which `J-Base-Save` writes into `world.json` when it is
installed. Without it, the namespace saves inline with the system in the normal save.