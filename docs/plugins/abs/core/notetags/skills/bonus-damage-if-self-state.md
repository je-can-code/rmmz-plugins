---
type: notetag
title: Bonus Damage If Self State
description: The tags adding bonus damage while the caster itself has a specific state active.
tags: [abs, tag, damage, state, self]
---

# Bonus Damage If Self State

## Description

### Bonus Damage If Self State

Sibling to [Bonus Damage If State](bonus-damage-if-state.md), but checks the caster's own active states instead of the
target's. Great for "empowered while buffed" kits.

### This Bonus Damage If Self State

Skill-scoped variant. Only applies while this exact skill is executing, layering on top of the caster-wide
`<bonusDamageIfSelfState>` tag rather than replacing it.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, including passives.
- Enemies
- Skills, for `<thisBonusDamageIfSelfState>`.

## TAG FORMAT

`<bonusDamageIfSelfState:[STATE_ID, PCT]>`
Where STATE_ID is the state that must be active on the caster.
Where PCT is the integer percent bonus to add while that state is active.

`<thisBonusDamageIfSelfState:[STATE_ID, PCT]>`

## TAG EXAMPLES

`<bonusDamageIfSelfState:[29, 50]>`
Adds a 50 percent bonus while state 29 is active on the caster.

`<thisBonusDamageIfSelfState:[STATE_SHADOW_FORM_ID, 40]>`
A rogue's "Shadow Form" empowers only their finishers.