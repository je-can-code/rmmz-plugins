---
type: notetag
title: Natural Growth
description: The integration details with the J-NaturalGrowth plugin, buffing and growing life cost (hcr).
tags: [resources, tag, plugin, external, growth, formula]
---

# Natural Growth

## Description

With `J-NaturalGrowth` also installed, life cost (`hcr`) accepts its buff and growth tags. Amounts are percents that
move the life cost as it is shown, so a negative amount is what makes skills cheaper- the opposite sign of
`<hcr:[NUM]>`, which is written as a reduction.

See [`J-NaturalGrowth`](../../../natural/core/notetags/natural-growth.md) for how Buff/Growth and Plus/Rate behave.

## TAG USAGE

- See [`J-NaturalGrowth`](../../../natural/core/notetags/natural-growth.md).

## TAG FORMAT

`<hcrBuffPlus:[FORMULA]>`
`<hcrBuffRate:[FORMULA]>`
`<hcrGrowthPlus:[FORMULA]>`
`<hcrGrowthRate:[FORMULA]>`

## TAG EXAMPLES

`<hcrGrowthPlus:[-2]>`
Lowers life cost by 2% per level.