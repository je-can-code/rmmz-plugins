---
type: notetag
title: States As Drop Sources
description: The drops tag on states, read from the defeated enemy's states and from the active party's states.
tags: [drops-passive, tag, state, enemy, party, loot]
---

# States As Drop Sources

## Description

This is `J-DropsControl`'s own tag, unchanged- see [that plugin's help](../../../core/notetags/additional-items.md) for
the full description. All this plugin changes is where it gets read from.

## NOTE ABOUT ENEMY STATES

Every state currently applied to the defeated enemy is scanned for the same `<drops:[...]>` tag `J-DropsControl` already
reads from the enemy itself.

This is what makes "burning enemies drop charcoal" or "an enemy afflicted with a treasure-marking state drops an extra
item" possible without editing a single enemy in the database.

## NOTE ABOUT PARTY STATES

Every state currently applied to any active battle member is also scanned, against every enemy that dies.

This is the "lucky charm" pattern: a passive skill state that adds an item to the global drop pool for as long as
somebody in the active party has it. Reserve members do not count- only who is actually fighting.

## TAG USAGE

- States

## TAG FORMAT

`<drops:[TYPE,ID,CHANCE]>`
Where TYPE is one of: `i`, `item`, `w`, `weapon`, `a`, `armor`.
Where ID is the id of the item/weapon/armor in the database.
Where CHANCE is the percent chance of this dropping.

## TAG EXAMPLES

`<drops:[i,3,25]>`
While this state is applied, there is a 25% chance of also dropping item 3.

`<drops:[a,7,100]>`
While this state is applied, armor 7 always additionally drops.