---
type: notetag
title: Forcing On-Crit Procs
description: The tag forcing every on-crit state application roll to succeed, without touching crit chance or luck.
tags: [crit, tag, state, on-crit, luck]
---

# Forcing On-Crit Procs

## Description

Have you ever wanted an on-crit state application to land every single time, no exceptions, without having to touch your
Accumulate/Encore/luck systems to get there? Well now you can! Applying this tag to the attacker's own note sources
forces every `thisCrit`/`onCrit` state-application roll from [On-Crit State Application](on-crit-state-application.md)
to succeed, as if the attacker had rolled a guaranteed positive result.

## NOTE ABOUT SCOPE

This ONLY affects the on-crit state application roll (`thisCritApply`, `thisCritSelf`, `onCritApply`, `onCritSelf`). It
does not change whether the hit itself crits, and it does not touch the attacker's real `isVeryLucky()` or
`isVeryCursed()` flags anywhere else- Accumulate Mode and Encore both still read the attacker's real values and stack
normally on top of this.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<forceCritProcs>`

## TAG EXAMPLES

`<forceCritProcs>`
Any battler with this tag applied to one of their note sources will always succeed their on-crit state application
rolls- a mastery capstone state with this tag turns an `onCritApply:[5, 25]` (25% chance) into a guaranteed application
on every critical hit, without inflating crit chance itself or touching luck elsewhere.