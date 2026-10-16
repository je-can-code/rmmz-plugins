---
type: notetag
title: Motion
description: The tag declaring a motion on an event page, from cycling motions to ones that travel somewhere and stay.
tags: [motion, tag, event, sprite, animation]
---

# Motion

## Description

Add a comment to an event page to declare a motion for its character.

Every motion works with no parameters at all. Parameters are positional and optional, filling in from left to right, so
you can specify only the first one and leave the rest at their defaults.

## NOTE ABOUT PERIODS AND DURATIONS

All periods and durations are in frames. The game runs at 60 frames per second, so a period of 150 is two and a half
seconds for one full cycle.

## NOTE ABOUT COLOUR

The hue, tint, tone and flash motions are more expensive than the others. Colouring a sprite gives it its own render
pass for the rest of its life, and the engine never takes that back. On a map holding a dozen coloured characters this
is nothing; on one holding a hundred it is worth knowing.

The plain motions- anything moving, scaling or rotating- cost nothing at all beyond the arithmetic.

## TAG USAGE

- Event comments, on an event page.

## TAG FORMAT

`<motion:[TYPE]>`
`<motion:[TYPE, PARAM, PARAM, ...]>`
Where TYPE is one of the motions listed below.
Where PARAM are that motion's parameters, in order.

### The cycling motions

`<motion:[breathe, AMOUNT, PERIOD]>`
Swells and narrows, the way a chest does.

`<motion:[stretch, AMOUNT, PERIOD]>`
Grows and shrinks in height only.

`<motion:[pulse, AMOUNT, PERIOD]>`
Grows and shrinks evenly, like a heartbeat.

`<motion:[float, DISTANCE, PERIOD]>`
Hovers above the ground and settles back to it.

`<motion:[sway, DISTANCE, PERIOD]>`
Drifts side to side.

`<motion:[swing, ANGLE, PERIOD]>`
Rocks back and forth about its feet, like a hanging sign.

`<motion:[spin, PERIOD, DIRECTION]>`
Turns in place. DIRECTION is `cw` or `ccw`.

`<motion:[ghost, MIN, MAX, PERIOD]>`
Fades in and out between two opacities.

`<motion:[flicker, MIN, MAX, INTERVAL]>`
Jumps between opacities, like a failing lamp.

`<motion:[shake, STRENGTH, AXIS, INTERVAL]>`
Vibrates. AXIS is `x`, `y`, or `both`.

`<motion:[hop, HEIGHT, DURATION, REST]>`
Leaps, lands, waits, and leaps again.

`<motion:[throb, RED, GREEN, BLUE, GRAY, PERIOD]>`
Pulses a colour tone in and out.

`<motion:[flash, COLOR, PERIOD]>`
Strobes a colour. COLOR is written as `#rrggbb`.

### The travelling motions

These ease to somewhere and stay there for as long as they are declared, then ease back when they are removed.

`<motion:[scale, PERCENT, DURATION]>`
Becomes larger or smaller. 150 is half again as big.

`<motion:[angle, DEGREES, DURATION]>`
Turns to face an angle and holds it.

`<motion:[fade, PERCENT, DURATION]>`
Becomes more or less transparent.

`<motion:[hue, DEGREES, DURATION]>`
Rotates the sprite's hue.

`<motion:[tint, COLOR, DURATION]>`
Tints the sprite toward a colour. COLOR is written as `#rrggbb`.

## TAG EXAMPLES

`<motion:[breathe]>`
This character breathes at the default depth and rate.

`<motion:[swing, 15, 200]>`
This character rocks 15 degrees to either side, over a 200 frame cycle.

`<motion:[float]>`
`<motion:[ghost]>`
This character hovers AND fades. Motions compose; declare as many as you like.

`<motion:[breathe, 0.08, 90, sync]>`
A deeper, quicker breath, deliberately in step with every other character declaring the same thing.