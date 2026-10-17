---
type: notetag
title: Proximity Knockback
description: The tag amplifying a battler's outgoing knockback by how many opposing battlers are near them.
tags: [abs, tag, knockback, proximity]
---

# Proximity Knockback

## Description

Amplifies this battler's outgoing knockback based on how many opposing battlers are currently near them. Evaluated
fresh against the live battlefield every time this battler lands a knockback hit.

## NOTE ABOUT ALLIES

Only opposing battlers count -- allies within RADIUS are ignored.

## NOTE ABOUT MULTIPLE TAGS

Multiple tags (different sources, different radii) all contribute independently and sum together.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills, on any skill the battler knows.

## TAG FORMAT

`<proximityKnockback:[RADIUS, PCT]>`
Where RADIUS is the tile radius (from this battler) to scan for enemies.
Where PCT is the percent bonus applied per enemy found within RADIUS.

## TAG EXAMPLES

`<proximityKnockback:[4, 25]>`
Orbiter's "Offended by Proximity" (+25% knockback per nearby enemy within 4 tiles).