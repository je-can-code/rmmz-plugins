---
type: notetag
title: Additional Items
description: The tag adding more item, weapon or armor drops to an enemy, beyond the three the editor allows.
tags: [drops, tag, enemy, loot]
---

# Additional Items

## Description

Have you ever wanted to drop more items than just three per enemy? Well now you can with the proper tags applied to
enemies in the database!

## NOTE ABOUT NATIVE DROP INTERACTIONS

This is additive in the sense that if you specify drop items using the editor and also have one or more of these tags on
an enemy, it will add all of them together as potential drops, exceeding the limit of 3.

## NOTE ABOUT DUPLICATE TAGS

You can have more than one of the same item drop, at the same or different rates and they will individually be
processed.

## TAG USAGE

- Enemies only.

## TAG FORMAT

`<drops:[TYPE,ID,CHANCE]>`
Where TYPE is either "i"/"item", "w"/"weapon", or "a"/"armor" (the short and long forms both work- use whichever reads
clearer to you).
Where ID is the id of the drop item in the database.
Where CHANCE is the percent chance to drop.

## TAG EXAMPLES

`<drops:[i,3,10]>`
This enemy has a [10% chance] to drop [an item] of [id 3 in the database].

`<drops:[w,12,65]>`
`<drops:[w,12,15]>`
`<drops:[a,5,100]>`
This enemy has a [65% chance] to drop [a weapon] of [id 12 in the database].
This enemy has a [15% chance] to drop [a weapon] of [id 12 in the database].
This enemy has a [100% chance] to drop [an armor] of [id 5 in the database].