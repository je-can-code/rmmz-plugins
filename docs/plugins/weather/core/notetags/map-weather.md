---
type: notetag
title: Map Weather
description: The tag declaring which named weather preset a map is drawn with.
tags: [weather, tag, map, preset]
---

# Map Weather

## Description

Declares a map's weather. The preset names an entry in `data/config.weather.json`. It says nothing about how hard it is
coming down, because that is not a property of the place- the Deluge Plains are rainy at every hour of every day, and
only the amount moves. That belongs to the sky, and the sky belongs to [`J-Weather-Time`](../../ext/time/overview.md).

On a map with [no sky overhead](../overview.md#what-a-map-with-no-tag-does), an authored look still draws- a cave full
of drifting motes is not weatherless- and simply sits at its middle strength.

## TAG USAGE

- Maps, in the map's note box.

## TAG FORMAT

`<weather:PRESET>`
Where PRESET names an entry in `data/config.weather.json`.

## TAG EXAMPLES

`<weather:rain>`
This place is rainy.

`<weather:motes>`
Faint drifting lights, as in a deep passage.