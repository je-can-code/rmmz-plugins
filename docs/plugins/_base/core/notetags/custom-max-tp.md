---
type: notetag
title: Custom Max TP
description: The tag defining how much max TP a database entry provides to the battler it belongs to.
tags: [base, tag, tp, battler]
---

# Custom Max TP

## Description

Have you ever wanted to define a max value for TP instead of the default of 100 across the board for all battlers? Well
now you can! By applying the correct tags to the relevant entries in the database, you too can have varying amounts of
max tp for actors and enemies alike!.

## NOTE ABOUT COMBINING TAGS

This is additive across the board, so if a single actor has multiple tags from various equipment and/or states, all
amounts of max tP will be summed together.

## NOTE ABOUT NEGATIVES

The tag value can be negative, so you can make "cursed" equipment or states that reduce TP capabilities.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<maxTp:VALUE>`
Where VALUE represents the amount of max TP provided by the entry.

## TAG EXAMPLES

`<maxTp:15>`    (on actor)
The max TP for this battler would be 15.

`<maxTp:25>`    (on state)
`<maxTp:100>`   (on weapon)
`<maxTp:50000>` (on armor)
The max TP for this battler would be 50125 until the state wears off, then it would reduce to 50100.