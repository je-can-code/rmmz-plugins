---
type: notetag
title: Gold Multiplier
description: The tag raising the gold the party earns from defeated enemies, by a percent.
tags: [drops, tag, party, gold, multiplier]
---

# Gold Multiplier

## Description

Have you ever wanted to have an actor gain bonus gold for some thiefy reason or another? Well now you can by applying
the proper tags to the various database locations that are relevant.

## NOTE ABOUT OTHER GOLD SOURCES

This does not apply to gold earned from other sources, such as event/script/plugin commands.

## NOTE ABOUT THE PARTY GOLD RATE

The bonuses from all members in the battle party will be considered by adding them all together to produce a "party gold
rate".

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- States

## TAG FORMAT

`<goldMultiplier:NUM>`
Where NUM is the a positive amount to increase gold earned rate.

## TAG EXAMPLES

`<goldMultiplier:50>`
The party will now gain +50% gold from defeated enemies.

`<goldMultiplier:65>`
`<goldMultiplier:10>`
`<goldMultiplier:100>`
The party will now gain +175% gold from defeated enemies.