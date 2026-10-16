---
type: notetag
title: Bonus Damage If State
description: The tags adding bonus damage while the target has a specific state active.
tags: [abs, tag, damage, state]
---

# Bonus Damage If State

## Description

### Bonus Damage If State

Adds PCT% bonus damage if the target currently has a specific state active. Multiple tags for the same state id stack
additively. Multiple tags for different state ids each contribute independently.

### This Bonus Damage If State

Skill-scoped variant of BONUS DAMAGE IF STATE. Adds PCT% bonus damage if the target currently has a specific state
active, but only when THIS skill is the action being resolved. Put on a specific skill to avoid bleeding the bonus
across the entire kit (unlike the caster-wide `bonusDamageIfState` tag). Multiple tags for different state ids each
contribute independently.

If this tag appears multiple times on the same skill (different state ids), each matching state adds PCT
independently to the total.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, including passives.
- Enemies
- Skills, for `<thisBonusDamageIfState>`.

## TAG FORMAT

`<bonusDamageIfState:[STATE_ID, PCT]>`
Where STATE_ID is the database id of the state to check.
Where PCT is the integer percent bonus to add when the state is present.

`<thisBonusDamageIfState:[STATE_ID, PCT]>`
Where STATE_ID is the database id of the state to check.
Where PCT is the integer percent bonus to add when the state is present.

## TAG EXAMPLES

`<bonusDamageIfState:[STATE_ID_PARALYZED, 25]>`
`<bonusDamageIfState:[STATE_ID_ROOTED, 25]>`
`<bonusDamageIfState:[STATE_ID_DISABLED, 25]>`
Puppet mastery — +25% if paralyzed, +25% if rooted, +25% if disabled. If the target has all three,
specificStateBonusPct = 75 (each fires independently).

`<thisBonusDamageIfState:[STATE_ID_STUN, 100]>`
Blade of the Dragon row 9 — +100% damage from this skill vs stunned enemies.