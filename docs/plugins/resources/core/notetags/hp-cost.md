---
type: notetag
title: HP Cost
description: The tags making a skill cost HP to execute, by a flat amount, a percentage of max HP, or a formula.
tags: [resources, tag, skill, cost, hp]
---

# HP Cost

## Description

Have you ever wanted your skills to cost HP in addition to (or instead of) MP and TP? Well now you can! By applying the
appropriate tag(s) to a skill, that skill will cost HP to execute. HP costs support flat amounts, percentages of max HP,
and formula expressions.

## NOTE ABOUT LETHAL COSTS

By default, a battler cannot cast a skill if its HP cost would kill them. Add the `<hp-cost-can-kill>` tag to allow
casting even when it would be lethal.

## TAG USAGE

- Skills

## TAG FORMAT

`<hp-cost:FLAT>`
Where FLAT is the flat amount of HP to deduct.

`<hp-cost:PERCENT%>`
Where PERCENT is the percentage of max HP to deduct.

`<hp-cost:[FORMULA]>`
Where FORMULA is an eval'd expression with access to `a` (the battler).

`<hp-cost-can-kill>`
Allows casting even when the HP cost would reduce HP to 0.

## TAG EXAMPLES

`<hp-cost:50>`
Costs exactly 50 HP.

`<hp-cost:10%>`
Costs 10% of max HP.

`<hp-cost:[a.mhp / 4]>`
Costs 25% of max HP via formula.

`<hp-cost-can-kill>`
This skill can be cast even if it would reduce the caster to 0 HP.