---
type: notetag
title: Conditional Critical Chance by Target State Type
description: The tags adding bonus crit chance when the target has any state carrying a given type classifier.
tags: [crit, tag, chance, state, type]
---

# Conditional Critical Chance by Target State Type

## Description

The same as the [state-id variants](conditional-critical-chance-by-target-state.md), but matching by type classifier
(the `<type:TYPE>` tag on states) rather than a specific state id. This lets you say "any bleed" instead of
"specifically state 15."

## NOTE ABOUT CASE SENSITIVITY

The type comparison is case-insensitive.

## TAG USAGE

- Skills, for both `<thisCritChanceIfStateType>` and `<critChanceIfStateType>`.
- Items, for `<thisCritChanceIfStateType>`.
- Actors, for `<critChanceIfStateType>`.
- Classes, for `<critChanceIfStateType>`.
- Weapons, for `<critChanceIfStateType>`.
- Armor, for `<critChanceIfStateType>`.
- Enemies, for `<critChanceIfStateType>`.
- States, for `<critChanceIfStateType>`.

## TAG FORMAT

`<thisCritChanceIfStateType:[TYPE, BONUS_CHANCE]>`
`<critChanceIfStateType:[TYPE, BONUS_CHANCE]>`
Where TYPE is the state type classifier string (case-insensitive).
Where BONUS_CHANCE is the percent crit chance bonus (0–100+) to add.

## TAG EXAMPLES

`<thisCritChanceIfStateType:[bleed, 100]>`
This skill has guaranteed crit chance against targets with any state typed "bleed".

`<critChanceIfStateType:[bleed, 50]>`
While this note source is active, all actions gain +50% crit chance against targets with any state typed "bleed".