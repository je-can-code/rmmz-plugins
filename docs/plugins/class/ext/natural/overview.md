---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [class-natural, overview]
version: "1.0.0"
---

# Overview

This plugin connects `J-Classes` to `J-NaturalGrowth`, for games whose classes carry natural growth tags.

## Integrations

Integrates with others of mine plugins:

- [`J-Base`](../../../_base/core/overview.md); to be honest this is just required for all my plugins.
- [`J-Classes`](../../core/overview.md); the [class scene](../../core/scenes/classes.md) this adds to.
- [`J-NaturalGrowth`](../../../natural/core/overview.md); the growths this shows.

## Details

The class scene lists one more section for the highlighted class, beneath its parameters:

- Growth per level: every [Growth](notetags/natural-growth.md) tag on the class. These are earned once for each level
  gained while the class is worn, and kept for good, so the class an actor levels in shapes them in every class
  afterwards.

Only the class's own note is read. Each formula is worked out for the actor as they would be in that class, so a formula
reading their level or a parameter's base shows what it would give right now.

A class's [Buff](notetags/natural-growth.md) tags have no section of their own. They apply only while the class is worn,
so they show in the values of the [parameters](../../core/overview.md#parameters) `J-Classes` lists, and in their
[multipliers](#multipliers), below.

## Multipliers

A parameter with no growth curve gets its multiplier from its flat Buff tag instead, measured the same way a curve is:
the class's buff at level 99 over the buff of the class the actor started the game in. A class authored as its starting
class's buff times some number shows exactly that number.

```
Starting class:  <hitBuffPlus:[1*a.level]>
This class:      <hitBuffPlus:[2*a.level]>
```

This class reads Accuracy ×2.00 among its parameters.