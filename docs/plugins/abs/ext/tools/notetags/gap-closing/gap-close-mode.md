---
type: notetag
title: Gap Close Mode
description: The tag choosing how the caster of a gap-closing skill travels to the resolved destination.
tags: [abs-tools, tag, skill, gap-close, movement]
---

# Gap Close Mode

## Description

Put this on the gap-closing skill to control HOW the caster travels to the resolved destination.

## NOTE ABOUT TERRAIN

All modes bypass terrain by default unless the skill also carries [`<respectTerrain>`](respect-terrain.md).

## TAG USAGE

- Skills, on the gap-closing skill.

## TAG FORMAT

`<gapCloseMode:MODE>`
Where MODE is one of: `blink` (instant teleport), `jump` (arcing hop- the default when omitted), or `travel` (steps
tile-by-tile, respecting collision along the way).

## TAG EXAMPLES

`<gapCloseMode:blink>`
The caster blinks (instant teleport) to the resolved destination.