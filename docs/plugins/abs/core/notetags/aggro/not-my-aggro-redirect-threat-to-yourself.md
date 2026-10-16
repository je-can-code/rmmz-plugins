---
type: notetag
title: Not My Aggro (Redirect Threat to Yourself)
description: The tags adjusting every teammate's standing aggro on the target, redirecting threat to the caster.
tags: [abs, tag, skill, aggro, taunt]
---

# Not My Aggro (Redirect Threat to Yourself)

## Description

Unlike the other aggro tags (which only touch the caster's own aggro entry), these adjust every OTHER battler's standing
aggro on the same target- battlers sharing the caster's team, excluding the caster's own entry. `notMyAggro` adds VAL
flat to each of those entries independently (can be negative). `notMyAggroPercent` scales each of those entries
independently as `entry *= (1 + VAL/100)`. Flat applies before percent, per entry.

## NOTE ABOUT HIT/MISS/PARRY

All aggro tags fire regardless of hit/miss/parry, same as the base aggro calculation chain.

## TAG USAGE

- Skills

## TAG FORMAT

`<notMyAggro:VAL>`
`<notMyAggroPercent:VAL>`

## TAG EXAMPLES

`<notMyAggro:-50>`
`<notMyAggroPercent:-25>`
On landing, every ally's standing aggro on this target drops by 50 flat, then by another 25% of whatever remains- a
taunt that pulls threat toward the caster and away from teammates fighting the same foe.