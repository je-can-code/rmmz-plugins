---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [level-flat, overview]
version: "1.0.2"
---

# Overview

This extension rewrites the experience curve from a scaling formula based on the inputs in the RMMZ editor for a class
to become a flat amount for every level- instead relying on level difference to define experience gained.

## Integrations

Integrates with others of mine plugins:

- [`J-Base`](../../../_base/core/overview.md); to be honest this is just required for all my plugins.
- [`J-LevelMaster`](../../core/overview.md); scaling knobs for combat/rewards still apply to non-EXP rewards. This
  plugin layers on top for the EXP-specific paths described below.
- [`J-ABS`](../../../abs/core/overview.md); kill EXP is decided when JABS asks how much experience the defeat was worth.

## Details

As mentioned above, this overwrites the experience curve and replaces the functionality with a flat amount per level
required to level up. This forces the dev and players to play heavier around levels and removes the burden of attempting
to balance experience gain with any other suite of factors that may influence it.

For awareness, the map revolves around the notion that it demands the player defeat ~40 enemies of equal level in order
to level up. If the enemy is above or below the level of the attacker (or average party level for default battles), then
the experience is modified accordingly. "What is that modification?" you might be asking. Here is the full range of +/-
15 level table of experience gain for you to understand, where "diff" is the difference in level between the actor and
the enemy, and the "exp" is the amount of experience gained according to the policy. The plugin parameter
"[Exp Policy Multiplier](parameters/policy-multiplier.md)" will multiply the "exp" value from this table. Given the
defaults, the N of "// N" seen in the table below represents the rough number of enemies that must be defeated in order
to level up.

```js
[
  { diff: -15, exp: 0 },    // impossible to level.
  { diff: -14, exp: 1 },    // 1000
  { diff: -13, exp: 1 },    // 1000
  { diff: -12, exp: 1 },    // 1000
  { diff: -11, exp: 1 },    // 1000
  { diff: -10, exp: 1 },    // 1000
  { diff: -9, exp: 3 },     // 334
  { diff: -8, exp: 6 },     // 166
  { diff: -7, exp: 10 },    // 100
  { diff: -6, exp: 12 },    // 83
  { diff: -5, exp: 14 },    // 72
  { diff: -4, exp: 16 },    // 63
  { diff: -3, exp: 18 },    // 56
  { diff: -2, exp: 20 },    // 50
  { diff: -1, exp: 22 },    // 45
  { diff: 0, exp: 25 },     // 40 - baseline
  { diff: 1, exp: 30 },     // 33
  { diff: 2, exp: 35 },     // 29
  { diff: 3, exp: 40 },     // 25
  { diff: 4, exp: 50 },     // 20
  { diff: 5, exp: 65 },     // 16
  { diff: 6, exp: 80 },     // 12
  { diff: 7, exp: 100 },    // 10
  { diff: 8, exp: 150 },    // 7
  { diff: 9, exp: 200 },    // 5
  { diff: 10, exp: 250 },   // 4
  { diff: 11, exp: 334 },   // 3
  { diff: 12, exp: 500 },   // 2
  { diff: 13, exp: 666 },   // 2
  { diff: 14, exp: 750 },   // 2
  { diff: 15, exp: 1000 },  // 1
]
```

## Note about notetags

This plugin has no notetags of its own. Everything here is tuned entirely through the plugin parameters below
([Exp Required Per Level](parameters/exp-per-level.md), [Exp Policy Multiplier](parameters/policy-multiplier.md)) and
the level-difference table above- there's nothing to tag on individual database objects.

## Note about EXR

Party members still apply their experience rate (`exr`) when the engine actually grants EXP. This plugin does not fold
`exr` into the policy number; that stays the engine's job in `gainExp`.

## Note about level

Depending on the form of battle, the plugin will assess the level difference differently. In default turn-based
battles, the level will be the average level of the party (mostly due to scope availability- or lack thereof). In JABS
on-the-map combat, the level of the one dealing the killing blow will be the one used to determine the experience gained
for all members of the party.

## Plugin parameters

The plugin parameters provide some arbitrary defaults for the the flat leveling experience.

- [Exp Required Per Level](parameters/exp-per-level.md): By default, this is set to 1000. This means that each level
  requires 1000 experience points to be gained in order to level up. This is tailored to the plugin's experience ladder
  based on level difference. You can adjust this to adjust how much experience is required to level up, but you'll also
  want to probably adjust the [policy multiplier](parameters/policy-multiplier.md) below to adapt.
- [Exp Policy Multiplier](parameters/policy-multiplier.md): A multiplier against the experience ladder based on level
  difference. This allows you to multiply the base amount of experience gained by defeating enemies. The current default
  is 1.00, but expects pretty high numbers of enemies to be defeated in order to level up (40 if levels are equal).