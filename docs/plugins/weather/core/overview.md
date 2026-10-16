---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [weather, overview]
---

# Overview

This plugin draws the ambience of a place: rain, drifting snow, leaves on the wind, embers over a lava flow, motes of
light in a dark passage.

None of those are separate features. Every one is the same emitter carrying a different picture along a different path,
which is why adding a new look is a data edit rather than a code change.

## Integrations

Integrates with others of my plugins:

- [`J-Base`](../../_base/core/overview.md); to be honest this is just required for all my plugins.
- [`J-Weather-Time`](../ext/time/overview.md); lets the sky change over the course of a day.

## Details

A map's weather is a property of THAT MAP. It is resolved fresh on arrival and never carries in from wherever the player
came from.

That matters more than it sounds. Weather that carried across a transfer would make a connecting corridor look
different depending on which end you walked in from, and every room next to an unusual one would have to re-assert
normality on the way out. Resolving per map means neither is ever a problem.

## What a map with no tag does

It asks the sky.

An outdoor map that says nothing gets whatever the weather currently is, which is what stops a connecting corridor
between two rainy fields being the one dry spot in the region. An indoor map that says nothing gets nothing, because
there is no sky for it to ask.

Indoor and outdoor is read from [`<noToneChange>`](../../time/core/notetags/maps/no-tone-change.md), the same tag
[`J-TIME`](../../time/core/overview.md) already uses to keep a cave from changing colour at dusk. "Can you see the sky
from here" is one question, and asking it twice would eventually get two answers.

## Naming the weather in text

Use anywhere text is shown- a message, a choice, a help line, a scene.

### Text code format

`\weather[TYPE, INTENSITY]`

TYPE is a preset name or the number it reports as; INTENSITY is light, moderate or heavy, or its number. Both come from
the same `presetIds` and `intensityIds` the map tags and the game variables already use, so a name that works in a
[notetag](notetags/map-weather.md) works here.

INTENSITY is optional. Leave it out to name the weather on its own.

### Text code examples

It becomes the weather's icon, its name, and its strength in brackets:

```
\weather[rain, heavy]     ->  <icon> rain (heavy)
\weather[snow]            ->  <icon> snow
\weather[1, 3]            ->  <icon> rain (heavy)
\weather[]                ->  whatever is falling on the player right now
```

### The empty form is the useful one

`\weather[]` reads whatever is actually falling where the player is standing, at the moment the line is drawn- so a line
written once stays true forever, rather than being a guess about what the sky is doing whenever the player finally gets
there. It reads the same resolution the map does, so it says fog in a foggy forest and snow on a snowy peak rather than
reporting the sky over town.

Somewhere nothing is falling, it says whatever `labels.nothing` in the configuration says- because the sentence it was
dropped into still has to finish.