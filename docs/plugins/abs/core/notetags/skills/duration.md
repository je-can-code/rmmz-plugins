---
type: notetag
title: Duration
description: The tag defining how long a skill's action event persists on the map.
tags: [abs, tag, skill, action, duration]
---

# Duration

## Description

How long the skill's action event persists on the map.

## NOTE ABOUT HIT COUNT

When a skill hits its maximum number of times (once by default, or as many as defined by the "pierce" tag), it
disappears.

## NOTE ABOUT MIN DURATION

Skills have an arbitrary minimum duration of 8 frames.

## TAG USAGE

- Skills

## TAG FORMAT

`<duration:FRAMES>`
Where FRAMES is how long in frames this event will exist.

## TAG EXAMPLES

`<duration:60>`
This skill's action event will exist for 60 frames.