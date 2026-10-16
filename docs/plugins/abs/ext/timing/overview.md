---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-timing, overview]
---

# Overview

This plugin enables modifications for cast times and cooldowns for actions.

Enables:

- NEW! added param ["Fast Cooldown"](notetags/fast-cooldown.md), for modifying cooldown times.
- NEW! added param ["Cast Speed"](notetags/cast-speed.md), for modifying cast speeds.

This plugin requires [JABS](../../core/overview.md). This plugin requires no plugin parameter configuration.

## Details

The new parameters of fast cooldown and cast speed are both cached to minimize processing time. The cache is refreshed
on the following events:

For all battlers:

- a new state is added.
- a current state is removed.

For only actors:

- new equipment is equipped.
- existing equipment is unequipped.
- leveling up.
- leveling down.

## New parameters

When using this plugin, there are two additional parameters that become defined on battlers, but they are computed
values that are applied to JABS related parameters, so they don't have shorthand properties like `atk`.

### Usage in JABS

In the context of JABS, these two parameters have very specific functions by default:

- Fast Cooldown: Modifies the [cooldown](../../core/notetags/skills/cooldown-management.md) associated with a JABS
  Action.
- Cast Speed: Modifies the [cast speed](../../core/notetags/skills/cast-time.md) associated with a JABS Action.

"JABS Action" usually just refers to the execution of an equipped skill... which means that in actuality, this can be
applied to various states and equipment to penalize or reward the player:

- Fast Cooldown:
  - Used to penalize with longer cooldowns from cursed states or equipment.
  - Used to reward with reduced cooldowns from equipment or states.
- Cast Speed:
  - Used to penalize with longer cast times due to bad states or equipment.
  - Used to reward with reduced or removed cast times from sagely equipment!

### Formula breakdown

Knowing the usage described of these two parameters, you'll be pleased to know they are calculated in exactly the same
way, but applied to the two separate values, cooldown and cast speed.

First, a base parameter for the value is established: "base fast cooldown" or "base cast speed" in this plugin's case.
If there is no base parameter values found, then zero is assumed the base parameter value. The same is assumed if all
found values summed together to equal zero. If any values are found, they are added together as one. This sum
represents a flat addition or subtraction against the calculated parameter- in frames.

Second, the flat modifier is evaluated: "cast speed flat" or "fast cooldown flat" in this plugin's case. If there are
no flat parameter values found, then zero is assumed to be the flat modifier value. The same is assumed if all found
values summed together to equal zero. If any values are found, they are added together as one. This summed value
represents a flat modifier against the base parameter when being combined with the multiplier. Higher of this will
increase the time required. Lower of this will reduce the time required. Being a flat modifier, this can have great
impact if your skills have low cooldowns considering this amount is directly being added to the cast time/cooldown
values recorded by the JABS Action.

Third, the multiplicative modifier is evaluated: "cast speed rate" or "fast cooldown rate" in this plugin's case. If
there are no rate parameter values found, then zero is assumed to be the rate modifier value. The same is assumed if
all found values summed together to equal zero. If any values are found, they are added together as one. This summed
value represents a "factor multiplier"\* against the original cast time derived from the action itself.

Fourth, and finally, the product of the original cast time being combined with the factor multiplier from step three
is added to the sum of the flat modifier derived from step two, resulting in a single new value that represents the
new cast time. There is validation logic that will ensure this amount didn't go below the
["minimum" cast time](parameters/minimum-cast-time.md) (defaults to 0). This amount- rounded- is returned as the REAL
cast time.

> \* **What is a factor multiplier?**
>
> A "factor multiplier" is a number that usually begins as a base-100 integer, such as 150, that is later divided by
> 100 to get a "multiplier" that indicates a percentage multiplier against another value. In the case of 150, the
> "factor multiplier" would be 1.5, aka +50% more than the base.