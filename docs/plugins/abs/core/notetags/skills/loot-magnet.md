---
type: notetag
title: Loot Magnet
description: The tags scaling how far the party leader draws loot drops toward themselves.
tags: [abs, tag, loot, range, modifier]
---

# Loot Magnet

## Description

### Loot Magnet Buff (flat additive, loot pickup radius only)

Adds N tiles to how far away the bearer draws loot drops toward themselves. The baseline it adds to is the
`loot.magnetRadius` value in the external config file at `data/config.jabs.json`.

Named "magnet" rather than "radius" so it cannot be mistaken for `radiusBuff`, which scales AoE splash. Only the party
leader's radius is consulted, since only the player collects loot.

### Loot Magnet Rate (multiplicative, loot pickup radius only)

Adds (N - 1.0) to the rate accumulator for the loot magnet radius, applied after every `lootMagnetBuff` has been
summed in.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, including passives.
- Skills

## TAG FORMAT

`<lootMagnetBuff:N>`
Where N is a signed decimal tile count.

`<lootMagnetRate:N>`
Where N is a non-negative decimal multiplier (1.0 = no change).

## TAG EXAMPLES

`<lootMagnetBuff:8>`
An accessory that inhales loot from well across the room.

`<lootMagnetRate:1.5>`
1.5x loot pickup radius.