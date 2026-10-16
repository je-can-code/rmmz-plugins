---
type: notetag
title: Aggro Percent (Own Existing Aggro)
description: The tag adjusting the caster's own standing aggro on the target by a percent.
tags: [abs, tag, skill, aggro]
---

# Aggro Percent (Own Existing Aggro)

## NOTE ABOUT HIT/MISS/PARRY

All aggro tags fire regardless of hit/miss/parry, same as the base aggro calculation chain.

## TAG USAGE

- Skills

## TAG FORMAT

`<aggroPercent:VAL>`
Where VAL is a percent adjustment applied to the caster's own ALREADY-STANDING aggro total on the target- not just this
hit's contribution. Resolved as `aggro *= (1 + VAL/100)`. Contrast with [`aggroMultiplier`](aggro-multiplier.md), which
only scales this one hit's newly-computed amount before it's added.

## TAG EXAMPLES

`<aggroPercent:100>`
If the caster already has 1000 standing aggro on the target, landing this skill doubles it to 2000 (in addition to
whatever this hit's own `<aggro>`/`<aggroMultiplier>` chain contributes).