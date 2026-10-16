---
type: notetag
title: Weather Pages
description: The event page tags requiring the weather on screen to be a given preset, strength, or range of strengths.
tags: [weather-time, tag, event, page, conditional]
---

# Weather Pages

## Description

A page may require the weather to be something, using comment commands in the same style as
[`J-TIME`'s](../../../../time/core/overview.md#time-gated-event-pages-and-choices).

These match what is ACTUALLY ON SCREEN - the resolved preset - rather than the sky's condition. So a creature that
comes out on clear summer nights is tagged `fireflies`, because fireflies are what a clear summer night looks like
where the player is standing.

Both names and numbers are accepted, matching `presetIds` and `intensityIds` in the weather config.

## TAG USAGE

- Event comments, on an event page.

## TAG FORMAT

`<weatherTypePage:PRESET>`
Where PRESET is the preset on screen, by its name or its number in `presetIds`.

`<weatherIntensityPage:INTENSITY>`
Where INTENSITY is light, moderate or heavy, by its name or its number in `intensityIds`.

`<weatherIntensityRangePage:WEAKEST-STRONGEST>`
Where WEAKEST and STRONGEST are the two ends of a range of strengths, by their names or their numbers in
`intensityIds`.

## TAG EXAMPLES

`<weatherTypePage:rain>`
This page is only active while the weather on screen is rain.

`<weatherIntensityPage:heavy>`
This page is only active while the weather on screen is heavy.

`<weatherIntensityRangePage:moderate-heavy>`
This page is only active while the weather on screen is anywhere from moderate to heavy.

`<weatherTypePage:fireflies>`
This page is only active while fireflies are on screen, which is what a clear summer night looks like.