---
type: notetag
title: Gap Close Position
description: The tag choosing where, relative to the target, the caster of a gap-closing skill lands.
tags: [abs-tools, tag, skill, gap-close, position]
---

# Gap Close Position

## Description

Put this on the gap-closing skill to control WHERE relative to the target the caster lands.

## TAG USAGE

- Skills, on the gap-closing skill.

## TAG FORMAT

`<gapClosePosition:POSITION>`
Where POSITION is one of: `infront` (adjacent, facing the target), `behind` (adjacent, on the target's far side), or
`same` (directly on the target's tile- the default when omitted).

## TAG EXAMPLES

`<gapClosePosition:behind>`
The caster lands adjacent to the target, on the target's far side.