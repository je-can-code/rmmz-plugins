---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [lighting, overview]
version: "1.0.0"
---

# Overview

This plugin lets a place be dark, and lets things in it give off light.

The engine has always been able to tint the screen, but a tint is uniform- it colours everything equally and cannot have
holes punched in it. That is why night in most games is "everything goes blue" rather than "you cannot see". This plugin
adds the other half: a mask that takes light away, which torches, lanterns and glowing things cut back out of.

## Integrations

Integrates with others of mine plugins:

- [`J-Base`](../../_base/core/overview.md); to be honest this is just required for all my plugins.

## Details

Darkness is DECLARED on the thing that has it, and lasts exactly as long as that declaration does. A map says how dark
it is in its own note box. An event page says what light it gives off in a comment. The party leader's equipment and
states say what light they carry.

Everything that reaches the screen is composed rather than overwritten. A cave that is dark, at an hour that is dark,
during a cutscene that has tinted everything red, resolves into one coherent picture- and when the cutscene lets go, the
cave is still dark, because nobody ever overwrote it.

A map that says nothing is not dark. Every map authored before this plugin existed is untouched by it, renders exactly
as it always has, and costs nothing at all.

## How things combine

DARKNESS COMPOUNDS. A map that is 30% dark, at an hour that is 40% dark, is 58% dark- not 70%. Each one takes away a
share of whatever light reached it, so two ordinary evenings never add up to a blackout.

THE COLOUR OF THE DARK belongs to whoever actually stated one. A map saying `<ambient:[85, #0a2a2a]>` keeps its teal
even when something that only knows how dark it is disagrees.

LIGHTS ADD TOGETHER. Two torches overlapping are brighter where they meet, the way two real ones would be.

## What goes dark and what does not

The mask sits directly above the weather. Everything painted below it goes dark with the world: the tilemap, characters,
their nameplates and gauges, and damage popups.

Everything a plugin adds to the spriteset sits above it and stays lit. That is where
[`J-ABS`](../../abs/core/overview.md) puts its cast previews and debug hitboxes, so attack telegraphs stay readable in a
pitch-black room.

ADDING YOURSELF TO THE SPRITESET IS HOW YOU OPT OUT OF THE DARK.

Anything that should glow within the world's own rules does not need to opt out at all- give it a
[`<light:...>`](notetags/light-source.md) tag and it lights the room it is in.

## Configuration

Defaults live in `data/config.lighting.json` rather than in plugin parameters, so retuning what a torch looks like
across the whole game is a data edit instead of a rebuild.

| Key | What it holds |
|---|---|
| `light.radius` | how far a light with no radius given reaches, in tiles |
| `light.color` | the colour a light with no colour given is |
| `light.intensity` | how evenly a light with no intensity given is filled |
| `light.effects` | one block per effect, tuning how it behaves |
| `ambient.color` | the colour of dark when a map does not say |

CONFIG NUMBERS ARE FRACTIONS, NOT PERCENTAGES. A tag is written by hand and so takes an intensity of 0 to 100; this file
is read by the game and takes the same thing as 0 to 1, matching `depth` beside it. `light.intensity: 0.5` is what
`<light:[5, 50]>` asks for.

Every effect is tuned by the same three numbers, so retuning one is the same job as retuning another:

- `depth`: how much brightness the effect may take away at its worst, 0 to 1
- `period`: how many frames one cycle of it takes
- `chance`: how likely a cycle is to fault at all- `glitch` alone reads this, and it is what decides how long the steady
  stretches are
- `variance`: how far either side of that period an individual light may sit

VARIANCE IS WHAT KEEPS A ROOM FROM BEATING AS ONE. Every light already starts somewhere different in its cycle, but two
lights running the exact same period hold that stagger forever, and a fixed relationship reads as choreography. A little
variance lets them drift in and out of agreement instead, the way two real flames do. Set it to 0 where you want a bank
of machines to fault together.