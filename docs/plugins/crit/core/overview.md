---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [crit, overview]
---

# Overview

This plugin enables the ability to control the multiplier of critical damage based on a pair of tags.

## Integrations

Integrates with others of mine plugins:

- `J-SDP` (can earn CDM and CDR from panels)
- `J-NaturalGrowths` (can grow CDM and CDR via levels)

## Details

This overwrites the `applyCritical()` function in its entirety and replaces the functionality with two new parameters on
battlers: `cdm` and `cdr`, which are described in [Critical Damage Multiplier](notetags/critical-damage-multiplier.md)
and [Critical Damage Reduction](notetags/critical-damage-reduction.md). One significant difference to note is that
critical hit damage is calculated and managed separately, allowing for a battler's CDR parameter to mitigate the
critical portion entirely while still taking the base damage. Additionally, the base critical damage multiplier is
reduced by default, and is parameterized for your convenience- because lets face it: triple damage for a crit is an
awful lot for the default.