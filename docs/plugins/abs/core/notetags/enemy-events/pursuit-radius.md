---
type: notetag
title: Pursuit Radius
description: The tag defining the radius an enemy will maintain while actively engaged in combat.
tags: [abs, tag, enemy, event, ai, pursuit]
---

# Pursuit Radius

## Description

Pursuit is the radius an enemy will maintain while actively engaged in combat. Think of it as the "sight radius after
aggro". It is typically designed to be larger than the sight radius so enemies don't trivially disengage the moment the
player steps back one tile.

## TAG USAGE

- Event comments, on an enemy event.
- Enemies, as a default for that enemy.

## TAG FORMAT

`<pursuit:RADIUS>`
Where RADIUS is the distance in tiles this enemy can pursue.

## TAG EXAMPLES

`<pursuit:6>`
This enemy can pursue up to 6 tiles away.