---
type: notetag
title: Cast Preview Warn At
description: The tag delaying a skill's hitbox preview until only the last frames of its cast remain.
tags: [abs, tag, skill, cast, preview, hitbox]
---

# Cast Preview Warn At

## Description

Instead of showing the preview for the full cast duration, this delays the preview until only the last N frames of the
cast remain.

Use this for a "danger warning" style: the hitbox flashes briefly right before the skill fires, giving the player a
reaction window instead of full cast visibility.

## TAG USAGE

- Skills

## TAG FORMAT

`<castPreviewWarnAt:FRAMES>`
Where FRAMES is how many frames before cast completion the preview should appear.

## TAG EXAMPLES

`<castPreviewWarnAt:20>`
The preview appears 20 frames before cast completion.