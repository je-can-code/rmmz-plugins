---
type: notetag
title: Climate
description: The tag bending the sky's strength through a named table before a map's own look is drawn.
tags: [weather-time, tag, map, climate]
---

# Climate

## Description

A place may answer the sky rather than follow it.

`<climate:NAME>` on a map's note box bends the sky's strength through a named table before it is drawn. The one this
ships for is the Forest of Dreams, which is foggiest when the sky is CLEAREST - something no amount of tuning the sky
itself can express, because it is a statement about somewhere in particular.

A climate only bends a look the map already authored with [`<weather:...>`](../../../core/notetags/map-weather.md). A
map with no weather of its own simply follows the sky.

## TAG USAGE

- Maps, in the map's note box.

## TAG FORMAT

`<climate:NAME>`
Where NAME names a table in the `climates` block of `data/config.weather.json`.

## TAG EXAMPLES

`<climate:dreaming>`
This map bends the sky's strength through the `dreaming` table.