---
type: notetag
title: Parry Extension Rate (PER)
description: The tag defining how many percent-points of parry window extension a source contributes.
tags: [abs, tag, parry, guard, stat, formula]
---

# Parry Extension Rate (PER)

## Description

A battler-wide stat that widens the parry window (see [Guarding](guarding.md)). This is not a per-skill tag -- it's
summed from every note source on the battler (actor, class, weapons, armors, states) and cached as a single
percent-point value, same as CDR (see [Cooldown Management](cooldown-management.md)).

Formula context: `a` = the battler being evaluated, `b` = 0, `v` = `$gameVariables._data`.

## NOTE ABOUT THE FINAL VALUE

The final summed value is converted from percent-points to a decimal (e.g. 50 percent-points becomes 0.50) and applied
as a multiplier against the skill's parry window: `Math.floor((1 + per) * parryDuration)`. A total of 50 percent-points
makes the parry window 1.5x as long.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States

## TAG FORMAT

`<per:[FORMULA]>`
Where FORMULA resolves to the percent-points of parry extension this source contributes.
All matching sources are summed together.

## TAG EXAMPLES

`<per:[15]>`
This source grants a flat +15 percent-points of parry window extension.

`<per:[a.agi * 0.2]>`
This source extends the parry window scaled off the battler's own AGI.