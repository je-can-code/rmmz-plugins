---
type: notetag
title: On Evade Apply
description: The tag defining a state a battler may inflict on the attacker who missed it.
tags: [abs, tag, on-chance, evade, state]
---

# On Evade Apply

## Description

When this battler evades an incoming attack, they may inflict a state on the attacker who missed them.

Use this for retributive effects — punishing the attacker for missing.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<onEvadeApply:[STATE_ID, CHANCE]>`
Where STATE_ID is the id of the state to apply to the attacker.
Where CHANCE is the integer percent chance to apply it (0-100).

## TAG EXAMPLES

`<onEvadeApply:[4, 25]>`
Applies the state of id 4 to the attacker, at a 25 percent chance to apply it.