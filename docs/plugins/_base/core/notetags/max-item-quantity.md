---
type: notetag
title: Max Item Quantity
description: The tag defining the maximum quantity allowed for an item, weapon or armor.
tags: [base, tag, item, weapon, armor, quantity]
---

# Max Item Quantity

## Description

Have you ever wanted to define a max quantity for items/weapons/armors in the database? Like, not just 99? Well now you
can! By applying the correct tags to the relevant entries in the database, you too can have various fixed and maximum
item quantities.

## NOTE ABOUT FUNCTIONALITY PERMANENCE

This max quantity stuff will likely get shifted to its own plugin eventually.

## TAG USAGE

- Items
- Weapons
- Armor

## TAG FORMAT

`<max:VALUE>`
Where VALUE represents the maximum quantity allowed for this item.

## TAG EXAMPLES

`<max:15>`
The maximum amount of the database entry decorated with this is 15.