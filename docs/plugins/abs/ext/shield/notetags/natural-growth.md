---
type: notetag
title: Natural Growth
description: The integration details with the J-NaturalGrowth plugin, growing shield amplification and effectiveness.
tags: [abs-shield, tag, plugin, external, growth, formula]
---

# Natural Growth

## Description

With `J-NaturalGrowth` also installed, shield amplification (`sar`) and shield effectiveness (`ser`) accept its buff
and growth tags. Amounts are percents, like [`<sar:25>`](shield-amplification-effectiveness.md).

See [`J-NaturalGrowth`](../../../../natural/core/notetags/natural-growth.md) for how Buff/Growth and Plus/Rate behave.

## TAG USAGE

- See [`J-NaturalGrowth`](../../../../natural/core/notetags/natural-growth.md).

## TAG FORMAT

`<sarBuffPlus:[FORMULA]>`
`<sarBuffRate:[FORMULA]>`
`<sarGrowthPlus:[FORMULA]>`
`<sarGrowthRate:[FORMULA]>`
Where `sar` is shield amplification.

`<serBuffPlus:[FORMULA]>`
`<serBuffRate:[FORMULA]>`
`<serGrowthPlus:[FORMULA]>`
`<serGrowthRate:[FORMULA]>`
Where `ser` is shield effectiveness.

## TAG EXAMPLES

`<sarGrowthPlus:[1.5]>`
Grants +1.5% per level.