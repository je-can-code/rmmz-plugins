---
type: notetag
title: Enemy Pool
description: The tag letting an enemy event roll which enemy it turns out to be, each time it is built.
tags: [abs, tag, enemy, event, pool]
---

# Enemy Pool

## Description

A spot on the map doesn't have to hold the same enemy every time. Give an enemy event a pool, and each time the event
is built (on map entry, on load, and on a respawn) it rolls which enemy it turns out to be, by each candidate's
[Enemy Weight](enemy-weight.md).

Landing on the spot's own `<enemyId>` leaves the page exactly as authored, with every tag on it applying. Landing on
anyone else swaps in that enemy's whole page from the [enemy map](../../parameters/enemy-map-id.md): its sprite, its
speed and its comments, so it arrives at its own default level rather than the spot's.

## NOTE ABOUT PAGE CONDITIONS

The page's conditions stay the spot's, so a time-gated spot stays time-gated whoever it rolls.

## NOTE ABOUT THE SPOT'S OWN ENEMY

List the spot's own id in the pool if it should ever roll itself. It rolls by the
[Default Enemy Pool Home Weight](../../parameters/default-enemy-pool-home-weight.md) plugin parameter rather than its own
weight, so a spot holding a rare enemy still mostly holds that enemy. Every other id in the pool needs an event on the
enemy map.

## TAG USAGE

- Event comments, on an enemy event, beside its `<enemyId>`.

## TAG FORMAT

`<enemyIds:[ENEMY_IDS]>`
Where ENEMY_IDS is a comma-separated list of enemy ids from the database.

## TAG EXAMPLES

`<enemyId:301>`
`<enemyIds:[301,302,303,304,305]>`
This spot usually holds enemy 301, and can roll any of the other four.