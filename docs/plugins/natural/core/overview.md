---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [natural, overview]
version: "3.1.0"
---

# Overview

This plugin enables "Natural Growth", aka formulaic parameter growth, for battlers. This "Natural Growth" enables
temporary/permanent stat growth while various tags are applied.

## Integrations

Integrates with others of mine plugins:

- `J-CriticalFactors`; enables natural growths of CDM/CTR.
- `J-Passives`; updates with relic gain as well.
- `J-LevelMaster`; enables the `.lvl` access for formulas.
- `J-SDP`; adds SDP to the options for reward-based formulas.

Any plugin that registers a parameter can bind natural growth to it, and several of mine do- see the
[glossary](notetags/natural-growth.md#custom-parameters) for every parameter and the plugin it comes from. Plugin order
does not matter for any of them.

## Details

The "Natural Growths" are separated into two categories:

- "Buffs": has effect while applied.
- "Growths": effect is applied permanently for every level gained.

Additionally, each "Natural Growth" can be applied in two ways:

- "Plus": a flat bonus to the base parameter.
- "Rate": a multiplicative bonus to the (base parameter + "plus" bonus).

## Units

Every tag is written in the numbers the status screen shows, and never in the fractions RMMZ keeps behind the scenes. A
75% chance is written as 75, not 0.75, whichever parameter it is for.

- `<lstGrowthPlus:[1.5]>` is +1.5% lifesteal for every level gained.
- `<criBuffPlus:[10]>` is +10% critical hit rate while applied.
- `<atkBuffPlus:[10]>` is +10 attack, since attack is already a whole number.
- `<harBuffRate:[10]>` is 10% more of whatever healing rate the battler has.

Parameters that are costs, such as life cost (`hcr`) or mp cost (`mcr`), move the cost exactly as it is shown, so a
negative number is what makes things cheaper: `<hcrGrowthPlus:[-2]>` lowers life cost by 2% per level.