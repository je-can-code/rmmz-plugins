---
type: notetag
title: Projectile Duration
description: The tag modifying how long all of a battler's map actions persist on the map.
tags: [abs, tag, battler, projectile, duration]
---

# Projectile Duration

## Description

A battler-wide percent-point modifier against how long ALL of this battler's map actions (projectiles, hitboxes,
everything with a `<duration:FRAMES>` tag) persist on the map. This is not a per-skill tag -- it's summed from every
note source on the battler (actor, class, weapons, armors, states), same as CDR/PER ([Cooldown
Management](cooldown-management.md), [PER](parry-extension-rate-per.md)).

## NOTE ABOUT CLAMPING

The combined total is clamped so the resulting multiplier never drops below 0 (a total of -100 or less reduces duration
to nothing).

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States

## TAG FORMAT

`<projectileDuration:PERCENT_POINTS>`
Where PERCENT_POINTS is the percent-point offset from the 100 baseline. All matching sources are summed together before
being applied.

## TAG EXAMPLES

`<projectileDuration:50>`
This source makes this battler's map actions last 150% as long (100 + 50).

`<projectileDuration:-40>`
This source makes this battler's map actions last 60% as long (100 - 40).