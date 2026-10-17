---
type: notetag
title: Linger
description: The tag defining how many frames an expired action event spends fading out.
tags: [abs, tag, skill, action, visual]
---

# Linger

## Description

When an action expires (runs out of hits or duration), it normally vanishes immediately. With linger, the action event
will fade out over the given number of frames instead, giving a visual tail. Collision is disabled during the linger
phase.

## NOTE ABOUT THE DEFAULT

All skills have a default linger of 10 frames if no tag is set. Set to 0 if you want the action event to disappear
instantly.

## TAG USAGE

- Skills

## TAG FORMAT

`<linger:FRAMES>`
Where FRAMES is how many frames to spend fading out.

## TAG EXAMPLES

`<linger:20>`
This action event spends 20 frames fading out.