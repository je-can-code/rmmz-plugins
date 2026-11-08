---
type: notetag
title: No Cast Preview (Per Skill)
description: The tag disabling the hitbox preview for one skill while it is being cast.
tags: [abs, tag, skill, cast, preview, hitbox]
---

# No Cast Preview (Per Skill)

## Description

Disables the preview for this specific skill while it is being cast.

The preview shows the skill's real hitbox, from where it will spawn and aimed where it will fire. A skill whose action
flies straight also shows a lane down its aim, as wide as what is flying and as long as its first second of flight,
fading out at the far end. An action that leaves on any other path shows the same lane reaching just one tile past its
hitbox, since the way it sets off is all anyone can promise. An action that stays put gets no lane.

Use this for skills where showing the hitbox preview would be too much of a hint or ruin the surprise.

## TAG USAGE

- Skills

## TAG FORMAT

`<noCastPreview>`

## TAG EXAMPLES

`<noCastPreview>`
No hitbox preview is shown while this skill is being cast.