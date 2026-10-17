---
type: notetag
title: Circumstantial Config Options
description: The tags modifying the base look or behavior of enemies.
tags: [abs, tag, enemy, event, config]
---

# Circumstantial Config Options

## Description

A few more tags modify the base look or behavior of enemies. Add these to the enemy (in the database or as an event
comment override) to change the defaults.

### Idling

By default, enemies idle in a 2-tile radius around where they were placed on the map. To change this:

`<jabsConfig:noIdle>`
`<jabsConfig:canIdle>`

### HP Bar

Enemies have small HP bars beneath them by default. To hide or force the HP bar to show:

`<jabsConfig:noHpBar>`
`<jabsConfig:showHpBar>`

### State Strip

Enemies show active affliction icons beneath their hp bar by default. To hide or force the strip to show:

`<jabsConfig:hideStates>`
`<jabsConfig:showStates>`

### Battler Name

The name of the enemy is shown beneath their character sprite. To conceal or reveal it:

`<jabsConfig:noName>`
`<jabsConfig:showName>`

### Invincible

To make an enemy completely invincible (skills will not connect), or to disable invincibility:

`<jabsConfig:invincible>`
`<jabsConfig:notInvincible>`

### Inanimate

Pots, crates, bushes, environmental objects -- things that shouldn't think, move, or react. This one tag disables AI,
movement, knockback, the HP bar, and more:

`<jabsConfig:inanimate>`
`<jabsConfig:notInanimate>`

## TAG USAGE

- Enemies
- Event comments, as an override on an enemy event.

## TAG FORMAT

`<jabsConfig:noIdle>`

`<jabsConfig:canIdle>`

`<jabsConfig:noHpBar>`

`<jabsConfig:showHpBar>`

`<jabsConfig:hideStates>`

`<jabsConfig:showStates>`

`<jabsConfig:noName>`

`<jabsConfig:showName>`

`<jabsConfig:invincible>`

`<jabsConfig:notInvincible>`

`<jabsConfig:inanimate>`

`<jabsConfig:notInanimate>`

## TAG EXAMPLES

`<jabsConfig:noIdle>`
This enemy will not idle around where it was placed on the map.