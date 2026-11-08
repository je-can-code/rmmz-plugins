---
type: notetag
title: Enemy Weight Override
description: The tag replacing an enemy's pool weight while on one map.
tags: [abs, tag, enemy, map, pool]
---

# Enemy Weight Override

## Description

A map can change how likely an enemy is to roll in its pools, without touching the enemy's own
[Enemy Weight](enemy-weight.md). While on this map, the named enemy carries the given weight in every pool that names
it, the spot's own enemy included. A weight of 0 keeps the enemy out of this map's rolls.

## TAG USAGE

- Maps, in the note box. One tag per enemy, one per line.

## TAG FORMAT

`<enemy-weight-override:[ENEMY_ID, WEIGHT]>`
Where ENEMY_ID is the enemy's id from the database, and WEIGHT is the weight it carries on this map.

## TAG EXAMPLES

`<enemy-weight-override:[302, 30]>`
On this map, enemy 302 carries a weight of 30 in any pool that names it.