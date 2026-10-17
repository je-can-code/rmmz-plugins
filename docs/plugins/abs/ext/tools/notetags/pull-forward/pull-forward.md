---
type: notetag
title: Pull Forward
description: The tag pulling a skill's target toward the caster on hit, the inverse of gap close.
tags: [abs-tools, tag, skill, pull, knockback]
---

# Pull Forward

## Description

The inverse of [gap close](../gap-closing/gap-closing.md): instead of the caster traveling to the target, the target is
pulled toward the caster. Unlike gap close, this is NOT key-gated- it behaves like
[knockback](../../../../core/notetags/skills/knockback.md) in reverse, and any target without enough
[`<knockbackResist>`](../../../../core/notetags/using-skills/knockback-resistance.md) to fully negate it gets pulled.

## NOTE ABOUT GAP CLOSING

If a skill carries both a pull-forward tag and a gap-close tag, the target is pulled first, then the caster gap-closes
to wherever the target ends up- the two meet partway instead of gap-close eating the entire distance.

## TAG USAGE

- Skills

## TAG FORMAT

`<pullForward:MAGNITUDE>`
Where MAGNITUDE is the number of tiles to pull the target toward the caster.

## TAG EXAMPLES

`<pullForward:3>`
On hit, this skill pulls the target 3 tiles toward the caster (before any `knockbackResist` reduction).