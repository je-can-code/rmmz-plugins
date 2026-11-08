---
type: notetag
title: Enemy Weight
description: The tag setting how likely an enemy is to be chosen when a pooled spot rolls it.
tags: [abs, tag, enemy, pool]
---

# Enemy Weight

## Description

When a spot with an [Enemy Pool](enemy-pool.md) rolls, each enemy in the pool has a chance relative to everyone else in
it, and this tag is that chance. An enemy without the tag is never chosen.

## NOTE ABOUT THE PLACED ENEMY

The enemy actually placed on a spot ignores its weight there and rolls by the
[Default Enemy Pool Home Weight](../../parameters/default-enemy-pool-home-weight.md) plugin parameter instead, so a spot
holding a rare enemy still mostly holds that enemy. A map can change any of these with an
[Enemy Weight Override](enemy-weight-override.md).

## TAG USAGE

- Enemies, in the database.

## TAG FORMAT

`<enemy-weight:WEIGHT>`
Where WEIGHT is a whole number. A pool rolls each enemy in proportion to its weight.

## TAG EXAMPLES

`<enemy-weight:8>`
This enemy carries a weight of 8 in any pool that names it.