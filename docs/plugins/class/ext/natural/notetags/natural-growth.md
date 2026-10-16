---
type: notetag
title: Natural Growth
description: The integration details with the J-NaturalGrowth plugin, for a class's growths and multipliers.
tags: [class-natural, tag, plugin, external, growth, buff]
---

# Natural Growth

## Description

This plugin reads the natural growth tags of `J-NaturalGrowth` on a class. Every Growth tag is listed in the class
scene's "Growth per level" section, and a parameter with no growth curve gets its multiplier from its flat Buff tag.

See [`J-NaturalGrowth`](../../../../natural/core/notetags/natural-growth.md) for how Buff/Growth and Plus/Rate behave.

## TAG USAGE

- Classes, only the class's own note is read.

## TAG FORMAT

`<(PARAM)GrowthPlus:[FORMULA]>`
`<(PARAM)GrowthRate:[FORMULA]>`
Where (PARAM) is the shorthand of a parameter natural growth is bound to.
Where [FORMULA] is the formula to produce the amount.

`<(PARAM)BuffPlus:[FORMULA]>`
Where (PARAM) is the shorthand of a parameter with no growth curve.
Where [FORMULA] is the formula to produce the amount, measured at level 99.

## TAG EXAMPLES

`<hitBuffPlus:[1*a.level]>`
On the starting class.

`<hitBuffPlus:[2*a.level]>`
On this class, which reads Accuracy ×2.00 among its parameters.