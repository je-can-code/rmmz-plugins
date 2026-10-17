---
type: notetag
title: Sight Radius
description: The tag defining how far around itself an enemy can perceive the player.
tags: [abs, tag, enemy, event, ai]
---

# Sight Radius

## Description

Sight is the radius around the enemy that it can perceive the player.
When the player enters this radius, the enemy will try to engage.

## NOTE ABOUT OBSTACLES

Enemy sight ignores obstacles like walls; they have x-ray vision.

## TAG USAGE

- Event comments, on an enemy event.
- Enemies, as a default for that enemy.

## TAG FORMAT

`<sight:RADIUS>`
Where RADIUS is the distance in tiles this enemy can see.

## TAG EXAMPLES

`<sight:4>`
This enemy perceives the player from up to 4 tiles away.