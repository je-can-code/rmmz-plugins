---
type: notetag
title: Purge States
description: The tag making a skill strip states off the target by priority when it lands a hit.
tags: [abs, tag, skill, state, cleanse]
---

# Purge States

## Description

A cleanse/dispel effect placed on a SKILL. When this skill lands a hit (parried and evaded actions do not trigger it),
it strips one or more states off the target by priority, highest-priority state first.

All three parameters are optional and fall back to their defaults if omitted or malformed.

## TAG USAGE

- Skills

## TAG FORMAT

`<purgeStates:[TYPE, ALLOW_DEATH, COUNT]>`
Where TYPE is one of "negative" (only `<type:negative>`-tagged states, default), "positive" (only states NOT tagged
`<type:negative>`), or "all" (no polarity filter).
Where ALLOW_DEATH is true/false for whether the death state (id 1) is eligible for removal (default false).
Where COUNT is how many states to strip, highest priority first (default 1).

## TAG EXAMPLES

`<purgeStates:[negative, false, 1]>`
Strips the single highest-priority negative state from the target. Equivalent to the tag's own defaults.

`<purgeStates:[all, false, 3]>`
A "cleanse burst" that strips up to 3 states (any polarity, never death) from the target, highest priority first.