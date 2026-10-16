---
type: notetag
title: State Durations
description: The tags defining how long a state lasts on the map, or that it never expires there.
tags: [abs, tag, state, duration, map]
---

# State Durations

## Description

`J-ABS` does not use MZ "Remove by Walking" for map timers. That checkbox only unlocked the `stepsToRemove` field in the
database editor. Use note tags instead.

RPG Maker MZ caps `stepsToRemove` at 9999 in the UI (~2.8 min at 60 fps). You may leave `stepsToRemove` as a
placeholder; `J-ABS` reads the tags below. Food chain HUD segments use the same duration getter.

## NOTE ABOUT FRAME RATE

RMMZ targets 60 FPS but may run lower under heavy load, so actual duration may exceed what the math suggests.

## TAG USAGE

- States

## TAG FORMAT

`<stateDuration:FRAMES>`
`<stateDurationSec:SECONDS>`   (optional; SECONDS * 60 = frames)
Finite timer (expires on the map).

`<indefiniteState>`
Indefinite (never expires on the map).

## TAG EXAMPLES

`<stateDuration:600>`
This state's finite timer expires on the map after 600 frames.

`<stateDurationSec:10>`
This state's finite timer expires on the map after 10 seconds (600 frames).

`<indefiniteState>`
This state never expires on the map.