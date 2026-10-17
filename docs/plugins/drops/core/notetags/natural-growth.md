---
type: notetag
title: Natural Growth
description: The integration details with the J-NaturalGrowth plugin, growing the drop rate and gold rate multipliers.
tags: [drops, tag, plugin, external, growth, formula]
---

# Natural Growth

## Description

Have you ever wanted your drop rate bonus to permanently grow along with your other growths because you're also using my
`J-NaturalGrowth` plugin? Well now you can! Both reward multipliers- drop rate (key `dor`) and gold rate (key `gdr`)-
accept `J-NaturalGrowths`' own builder-like Buff/Growth tag pattern on top of the flat
[`<dropMultiplier:NUM>`](drop-multiplier.md) and [`<goldMultiplier:NUM>`](gold-multiplier.md) tags, and can be earned
from SDP panels.

Please refer to the [`J-NaturalGrowth` documentation](../../../natural/core/notetags/natural-growth.md) for more details
on the Buff/Growth/Plus/Rate pattern itself.

## NOTE ABOUT J-NATURALGROWTH

This section requires `J-NaturalGrowth` to be loaded. Without it, these tags are silently ignored (the same as always-
just nothing computes them). Where the two plugins sit in the plugin list does not matter.

## NOTE ABOUT UNITS

Every amount is a percent, exactly like the [drop](drop-multiplier.md) and [gold](gold-multiplier.md) multiplier tags,
so `<dorBuffPlus:[15]>` and `<dropMultiplier:15>` both grant +15% drops.

## NOTE ABOUT FORMULAS

Formula context:

- `a` = the battler these bonuses are being calculated for
- `b` = the multiplier this battler's own tags produce, in percent (the summed `<dropMultiplier>` for `dor`, the summed
  `<goldMultiplier>` for `gdr`)
- `v` = `$gameVariables._data`

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- States

## TAG FORMAT

`<dorBuffPlus:[FORMULA]>`
`<dorBuffRate:[FORMULA]>`
`<dorGrowthPlus:[FORMULA]>`
`<dorGrowthRate:[FORMULA]>`
`<gdrBuffPlus:[FORMULA]>`
`<gdrBuffRate:[FORMULA]>`
`<gdrGrowthPlus:[FORMULA]>`
`<gdrGrowthRate:[FORMULA]>`
Where "Buff" is temporary (lost when the tag's source is removed) and "Growth" is permanent (accumulates and stays as
you level).
Where "Plus" is a flat amount and "Rate" is a percent-of-base amount.

## TAG EXAMPLES

`<dorGrowthPlus:[a.level * 0.5]>`
Permanently gain (level × 0.5)% drop rate per level.

`<dorBuffPlus:[15]>`
Gain a flat 15% drop rate while this tag's source is applied; lost if the source is removed.

`<gdrGrowthPlus:[2]>`
Permanently gain 2% more gold per level.