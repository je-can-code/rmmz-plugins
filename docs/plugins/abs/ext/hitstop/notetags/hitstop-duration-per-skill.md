---
type: notetag
title: Hitstop Duration (Per Skill)
description: The tag setting how many base frames of hitstop a skill's hits apply on impact.
tags: [abs-hitstop, tag, skill, hitstop]
---

# Hitstop Duration (Per Skill)

## Description

Set how many frames of hitstop this skill's hits apply on impact.
Without this tag, the plugin's global default base frames are used.

## TAG USAGE

- Skills

## TAG FORMAT

`<hitstop:FRAMES>`
Where FRAMES is the base number of frames to freeze on impact.

## TAG EXAMPLES

`<hitstop:8>`
This skill applies 8 base frames of hitstop on every hit, before crit/guard/target-scale adjustments are layered on.