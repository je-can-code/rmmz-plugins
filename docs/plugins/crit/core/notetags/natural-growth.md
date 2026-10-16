---
type: notetag
title: Natural Growth
description: The integration details with the J-NaturalGrowth plugin, growing CDM and CDR by flat or rate multipliers.
tags: [crit, tag, plugin, external, growth, formula]
---

# Natural Growth

## Description

Have you ever wanted to permanently grow your CDM/CDR stats along with your other growths that you have setup because
you're also using my `J-NaturalGrowth` plugin? Well now you can! By taking advantage of the same builder-like pattern
already established by the natural growths plugin, you too can start growing your CDR and CDM by flat or rate
multipliers as you level up!

Please refer to the other plugin's documentation for more details.

## NOTE ABOUT UNITS

Like every `J-NaturalGrowths` tag, the amounts are percents: a `Plus` of 10 adds 10% to the stat, and a `Rate` of 10
adds 10% of the base value below.

## NOTE ABOUT CTR RATES

Since the base crit reduction is 0 by default, a `ctr` `Rate` tag adds nothing until something grants a base through a
`<critReductionBase>` tag. Use a `Plus` tag to grant crit reduction outright.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<(PARAM)(BUFF|GROWTH)(PLUS|RATE):[FORMULA]>`
Where (PARAM) is literally one of either `cdm` (crit damage multiplier) or `ctr` (crit taken rate- internally this is
the same stat the [`critReduction` tags](critical-damage-reduction.md) feed into, just spelled differently here for
consistency with how `J-NaturalGrowths` names its own tag families).
Where (BUFF|GROWTH) is literally one of either `Buff` or `Growth`.
Where (PLUS|RATE) is literally one of either `Plus` or `Rate`.
Where [FORMULA] is a real formula this time (unlike the
[`thisCritChance`/`thisCritMultiplier` tags](this-action-critical-modifiers.md))- it runs through the standard evaluator
with:
- `a` = the battler these bonuses are being calculated for
- `b` = the battler's base value for this parameter, in percent (`baseCriticalMultiplier()` for `cdm` tags- 0.5 by
  default, so b is 50; `baseCriticalReduction()` for `ctr` tags- 0 by default, so b is 0)
- `v` = `$gameVariables._data`

## TAG EXAMPLES

`<cdmGrowthRate:[5]>`
Gain 5% of the base crit damage multiplier (`cdm`) per level- with the default base of 50%, that is +2.5% per level.

`<ctrBuffPlus:[25]>`
Gain a flat 25% crit taken rate reduction (`ctr`) while this tag is applied to this battler.
This would be lost if the object this tag lived on was removed.

`<cdmGrowthPlus:[a.level * 3]>`
Gain (the battler's level multiplied by 3)% crit damage multiplier (`cdm`) per level.
This would result in gaining an ever-increasing amount of crit damage multiplier per level.