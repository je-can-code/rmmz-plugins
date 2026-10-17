---
type: notetag
title: Natural Growth
description: The J-NaturalGrowth integration, growing lifesteal, manasteal and techsteal with its buff and growth tags.
tags: [resources-abs, tag, plugin, external, growth, formula]
---

# Natural Growth

## Description

With `J-NaturalGrowth` also installed, lifesteal (`lst`), manasteal (`mst`) and techsteal (`tst`) accept its buff and
growth tags. Amounts are percents, like `<lst:NUM>`: `<lstGrowthPlus:[1.5]>` grants +1.5% lifesteal per level.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<(lst|mst|tst)(Buff|Growth)(Plus|Rate):[FORMULA]>`
Where (lst|mst|tst) is literally one of `lst` (lifesteal), `mst` (manasteal) or `tst` (techsteal).
Where (Buff|Growth) is literally one of either `Buff` or `Growth`.
Where (Plus|Rate) is literally one of either `Plus` or `Rate`.
Where [FORMULA] is the amount, in percents like `<lst:NUM>`.
See [`J-NaturalGrowth`](../../../../natural/core/notetags/natural-growth.md) for how Buff/Growth and Plus/Rate behave.

## TAG EXAMPLES

`<lstGrowthPlus:[1.5]>`
Grants +1.5% lifesteal per level.