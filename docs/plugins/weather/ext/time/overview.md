---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [weather-time, overview]
---

# Overview

This plugin makes the weather a thing that happens rather than a property a map owns.

`J-Weather` draws what a place looks like. `J-TIME` knows what hour it is. This is the piece in between: it decides
what the sky over the whole island is doing right now, rolls that decision a year into the future so it can be read,
and hands the answer to `J-Weather` to draw.

## Integrations

Integrates with others of mine plugins:

- [`J-Base`](../../../_base/core/overview.md); to be honest this is just required for all my plugins.
- [`J-Weather`](../../core/overview.md); this is an extension of it.
- [`J-TIME`](../../../time/core/overview.md); this is where the calendar comes from.

## Details

The sky holds a CONDITION and a STRENGTH, and the two move separately.

The condition steps through a transition graph belonging to the current season, so a day reads as a sequence rather
than as dice: overcast eases into light rain, rain eases back off into overcast, and overcast clears. Seasons hard-gate
which conditions are even possible, which is why it never snows in summer and why sakura is a spring thing.

The strength takes a single step up or down a three-rung ladder - light, moderate, heavy - and never jumps. A type may
narrow that ladder for itself: a monsoon is heavy or it is not a monsoon.

## Conditions and faces

A condition is a state the sky is IN. A face is the preset it is DRAWN with, chosen by season and hour.

A clear summer afternoon and a clear winter afternoon are the same state and completely different pictures - one is a
heat shimmer and the other is ice hanging in still air. Rather than make those separate conditions and author every
edge into and out of "clear" twice over, they are faces of one.

This is also the only way some looks ever appear at all. Fireflies are the face of a clear summer night; a field of
stars is the face of any other clear night.

## Settling days

On the last day of a season the sky stops rolling and starts steering: each phase takes whichever step gets it closest
to clear.

That gives a season handover a whole day to happen in, so the incoming season starts from somewhere neutral and can
bias away from it. Without it, the last phase of autumn could be a monsoon and the first phase of winter a blizzard,
with nothing in between.

Note that seasons do NOT sit on calendar quarters - winter is months 12, 1 and 2 - so the settling days are the last
day of months 2, 5, 8 and 11.

## Configuration

The sky lives in the `sky` and `climates` blocks of `data/config.weather.json` - the same file as the presets it
names, so a face pointing at a preset that does not exist can be caught by reading.

| Key | What it holds |
|---|---|
| `sky.types` | every condition, its preset, and its faces |
| `sky.seasons` | which conditions each season permits, and the graph |
| `sky.intensityDrift` | how much the strength wants to hold, rise or fall |
| `sky.settleTo` | the condition a season handover steers toward |
| `sky.forecastPhases` | how far ahead the forecast is rolled |
| `sky.visibleDays` | how much of it the forecast scene shows at once |
| `climates.<name>` | how one kind of place bends the sky |