---
type: notetag
title: Disable Hitstop (Per Skill)
description: The tag fully disabling hitstop for a skill's hits.
tags: [abs-hitstop, tag, skill, hitstop]
---

# Disable Hitstop (Per Skill)

## Description

Fully disables hitstop for this skill's hits, ignoring the global default and this skill's own
[`<hitstop:FRAMES>`](hitstop-duration-per-skill.md) tag if both are somehow present.

## TAG USAGE

- Skills

## TAG FORMAT

`<noHitstop>`

## TAG EXAMPLES

`<noHitstop>`
Hits from this skill never trigger a freeze-frame pause, even if the global default has hitstop enabled for everything
else.