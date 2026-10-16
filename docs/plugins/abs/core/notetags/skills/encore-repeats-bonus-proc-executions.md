---
type: notetag
title: Encore Repeats (Bonus Proc Executions)
description: The tag defining how many extra times a battler's successful on-chance procs execute.
tags: [abs, tag, on-chance, encore, formula]
---

# Encore Repeats (Bonus Proc Executions)

## Description

A battler-wide bonus to how many times a successful on-chance proc (bonus hits, retaliate, on-evade, on-defeat, etc.)
actually executes once it succeeds. A proc that would normally fire once instead fires `1 + encoreRepeats` times.

Formula context: `a` = the battler being evaluated, `b` = 0, `v` = `$gameVariables._data`.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<encoreRepeats:[FORMULA]>`
Where FORMULA resolves to the number of bonus executions per success.

## TAG EXAMPLES

`<encoreRepeats:[1]>`
This source grants 1 bonus execution per success.