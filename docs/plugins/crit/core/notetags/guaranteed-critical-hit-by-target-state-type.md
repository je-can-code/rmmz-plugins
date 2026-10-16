---
type: notetag
title: Guaranteed Critical Hit by Target State Type
description: The tags guaranteeing a critical hit when the target has any state carrying a given type classifier.
tags: [crit, tag, guaranteed, state, type]
---

# Guaranteed Critical Hit by Target State Type

## Description

The same as the [state-id guaranteed-crit variants](guaranteed-critical-hit-by-target-state.md), but matching by type
classifier rather than a specific state id.

## NOTE ABOUT CASE SENSITIVITY

The type comparison is case-insensitive.

## TAG USAGE

- Skills, for both `<thisCritsAlwaysIfStateType>` and `<critAlwaysIfStateType>`.
- Items, for `<thisCritsAlwaysIfStateType>`.
- Actors, for `<critAlwaysIfStateType>`.
- Classes, for `<critAlwaysIfStateType>`.
- Weapons, for `<critAlwaysIfStateType>`.
- Armor, for `<critAlwaysIfStateType>`.
- Enemies, for `<critAlwaysIfStateType>`.
- States, for `<critAlwaysIfStateType>`.

## TAG FORMAT

`<thisCritsAlwaysIfStateType:TYPE>`
`<critAlwaysIfStateType:TYPE>`
Where TYPE is the state type classifier string (case-insensitive).

## TAG EXAMPLES

`<thisCritsAlwaysIfStateType:bleed>`
This skill always crits against targets with any state typed "bleed".

`<critAlwaysIfStateType:bleed>`
While this note source is active, all actions always crit against targets with any state typed "bleed".