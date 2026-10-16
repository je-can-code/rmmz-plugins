---
type: notetag
title: Guaranteed Critical Hit by Target State
description: The tags guaranteeing a critical hit when the target has any one of the listed states active.
tags: [crit, tag, guaranteed, state]
---

# Guaranteed Critical Hit by Target State

## Description

Have you ever wanted a skill to always crit against a target that has a specific state — without needing to route
through the chance system? Well now you can! By applying the appropriate tags, you can guarantee a critical hit when the
target has any one of the listed states active.

Two families of tags are available, mirroring the `thisCrit`/`crit` split:

`thisCritsAlwaysIfState` lives on a specific skill or item and only triggers for THAT skill's execution.

`critAlwaysIfState` lives on any note source attached to the attacker and triggers for ALL of their actions.

## NOTE ABOUT MULTIPLE STATE IDS

Each tag accepts one or more state IDs. The crit is guaranteed if the target has ANY of the listed states active — you
do not need all of them.

## NOTE ABOUT MULTIPLE TAGS

Multiple tags stack via OR — if any tag's state list contains a state the target has, the crit is guaranteed.

## NOTE ABOUT CRIT EVASION

A guaranteed crit from these tags bypasses the target's crit evasion (`cev`), exactly like
[`<thisCritsAlways>`](this-action-critical-modifiers.md).

## TAG USAGE

- Skills, for both `<thisCritsAlwaysIfState>` and `<critAlwaysIfState>`.
- Items, for `<thisCritsAlwaysIfState>`.
- Actors, for `<critAlwaysIfState>`.
- Classes, for `<critAlwaysIfState>`.
- Weapons, for `<critAlwaysIfState>`.
- Armor, for `<critAlwaysIfState>`.
- Enemies, for `<critAlwaysIfState>`.
- States, for `<critAlwaysIfState>`.

## TAG FORMAT

`<thisCritsAlwaysIfState:[STATE_ID, ...]>`
`<critAlwaysIfState:[STATE_ID, ...]>`
Where STATE_ID is one or more state ids (comma-separated) to check on the target.

## TAG EXAMPLES

`<thisCritsAlwaysIfState:[14]>`
This skill always crits against targets afflicted with state 14.

`<thisCritsAlwaysIfState:[14, 7]>`
This skill always crits against targets afflicted with state 14 OR state 7.

`<critAlwaysIfState:[14]>`
While this note source is active on the attacker, all of their actions always crit against targets afflicted with state
14.