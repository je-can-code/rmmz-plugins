---
type: notetag
title: Max Slots / Max Slot Points
description: The tags granting bonus slots or slot points on top of an actor's baseline, stacking across every source.
tags: [sks, tag, slot, bonus, formula]
---

# Max Slots / Max Slot Points

## Description

Want to grant bonus slots or slot points from equipment, states, or other sources? By applying the appropriate tag
across the various database locations, you can add to an actor's baseline capacity. Unlike the
[base tags](base-slots-base-slot-points.md), these stack additively across every source found.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- States

## TAG FORMAT

`<maxSlots:[FORMULA]>`
Where FORMULA computes a bonus to the actor's slot count.

`<maxSlotPoints:[FORMULA]>`
Where FORMULA computes a bonus to the actor's slot point budget.

## TAG EXAMPLES

`<maxSlots:[1]>`
This source grants +1 bonus slot while active/equipped.

`<maxSlotPoints:[-2]>`
This source reduces the actor's slot point budget by 2 while active.