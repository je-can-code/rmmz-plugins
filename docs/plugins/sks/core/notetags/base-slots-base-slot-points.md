---
type: notetag
title: Base Slots / Base Slot Points
description: The tags defining the formula-driven baseline of slots and slot points an actor has innately.
tags: [sks, tag, actor, class, slot, formula]
---

# Base Slots / Base Slot Points

## Description

Want to control how many slots or slot points an actor has innately, and have that scale as they grow? By applying the
appropriate tag to an actor or their class, you can define a formula-driven baseline for either capacity. When neither
the actor nor their class carries the tag, the plugin's configured default is used instead.

These formulas have access to `a` (the actor) and `v` (the game's variables), so growth curves can reference things
like the actor's level.

## TAG USAGE

- Actors
- Classes

## TAG FORMAT

`<baseSlots:[FORMULA]>`
Where FORMULA computes the actor's baseline slot count.

`<baseSlotPoints:[FORMULA]>`
Where FORMULA computes the actor's baseline slot point budget.

## TAG EXAMPLES

`<baseSlots:[4]>`
This actor/class has a flat baseline of 4 slots.

`<baseSlotPoints:[6 + (a.level * 0.5)]>`
This actor/class's baseline slot points grow by half a point per level, starting from a base of 6.