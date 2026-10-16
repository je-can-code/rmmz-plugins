---
type: notetag
title: On-Cast Animation
description: The tag defining an animation that plays once on the caster at the moment a skill fires.
tags: [abs, tag, skill, casting, animation]
---

# On-Cast Animation

## Description

An animation that plays on the caster once the cast is complete and the skill fires. Unlike the CAST ANIMATION (which
loops during casting), this plays exactly once at the moment of skill execution.

Use this to create a "launch" effect -- e.g., the cast animation builds up tension, and the on-cast animation is the
visible "release".

## TAG USAGE

- Skills

## TAG FORMAT

`<onCastAnimationId:VAL>`
Where VAL is the animation id to play at the moment of execution.

## TAG EXAMPLES

`<onCastAnimationId:46>`
The animation of id 46 plays on the caster at the moment of execution.