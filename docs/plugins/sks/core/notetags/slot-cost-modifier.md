---
type: notetag
title: Slot Cost Modifier
description: The tag adjusting the effective slot cost of every skill for the actor it is active on.
tags: [sks, tag, slot, cost, modifier]
---

# Slot Cost Modifier

## Description

Want to adjust the slot cost of skills based on what an actor has equipped or what states they are under? By applying
the appropriate tag across the various database locations, you can modify the effective slot cost of skills for that
actor.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States

## TAG FORMAT

`<slotCostModifier:AMOUNT>`
Where AMOUNT is the flat modifier applied to all skill slot costs. Negative values reduce the cost; positive values
increase it.

## TAG EXAMPLES

`<slotCostModifier:-1>`
All skills cost 1 fewer slot point while this is active on the actor.