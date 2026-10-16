---
type: notetag
title: Natural Growth
description: The integration details with the J-NaturalGrowth plugin, growing move speed boost by buffs and growths.
tags: [abs-speed, tag, plugin, external, growth, formula]
---

# Natural Growth

## Description

With `J-NaturalGrowth` also installed, move speed boost (`msb`) accepts its buff and growth tags, in the same numbers
as [`<speedBoost:NUM>`](movement-speed-boost.md).

See [`J-NaturalGrowth`](../../../../natural/core/notetags/natural-growth.md) for how Buff/Growth and Plus/Rate behave.

## TAG USAGE

- See [`J-NaturalGrowth`](../../../../natural/core/notetags/natural-growth.md).

## TAG FORMAT

`<msbBuffPlus:[FORMULA]>`
`<msbBuffRate:[FORMULA]>`
`<msbGrowthPlus:[FORMULA]>`
`<msbGrowthRate:[FORMULA]>`
Where `msb` is move speed boost.

## TAG EXAMPLES

`<msbGrowthPlus:[1]>`
Grants +1 speed boost per level.