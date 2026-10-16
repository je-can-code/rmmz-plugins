---
type: notetag
title: Ending a Chain (Metabolize)
description: The tag making a skill end the caster's active food arc when it executes.
tags: [abs-food, tag, skill, food, chain, metabolize]
---

# Ending a Chain (Metabolize)

## Description

Tag a skill so that executing it ends the caster's active food arc.

There is no tail phase and no consolation state; the arc is simply over. This is what makes a "metabolize" skill cost
the meal that fuelled it.

## NOTE ABOUT SLOT TRANSFORMS

Pair it with `J-ABS` core's [`<slotTransform:[UsableItem, SKILL_ID]>`](../../../core/notetags/states/slot-transform.md)
on each phase state to turn the R2 button into that skill for as long as the arc runs — eat when empty, burn the meal
when full. Because the tag is read off the executed skill rather than tracked through whatever dispatched it, an enemy
attack may carry it too and take the player's meal away.

## NOTE ABOUT OMITTING THE TAG

OMITTING THE TAG IS A DESIGN CHOICE, NOT AN OVERSIGHT. A skill that burns fuel without spending the arc is an endurance
move, bounded by the chain's own duration rather than by a single use. Nothing warns about its absence.

## TAG USAGE

- Skills

## TAG FORMAT

`<endFoodChain>`

## TAG EXAMPLES

`<endFoodChain>`
Executing this skill ends the caster's active food arc.