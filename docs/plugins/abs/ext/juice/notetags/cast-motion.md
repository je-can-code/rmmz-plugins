---
type: notetag
title: Cast Motion
description: The tag selecting the body motion a skill's caster shows for the whole of its cast.
tags: [abs-juice, tag, skill, motion, cast]
---

# Cast Motion

## Description

Selects the body motion shown for the WHOLE of this skill's cast, as opposed to
[`<juiceMotion:NAME>`](juice-motion.md), which plays once at execution. Valid values:

- `squish` - a fixed-period squat, width swelling as height compresses, for the length of the cast. Reads as effort
  being spent rather than energy gathering.

When omitted, the cast shows the default accelerating charge pulse.

## TAG USAGE

- Skills

## TAG FORMAT

`<castMotion:NAME>`
Where NAME is the cast motion, one of the valid values above.

## TAG EXAMPLES

`<castMotion:squish>`
While this skill is being cast, the caster squats on a fixed rapid period.