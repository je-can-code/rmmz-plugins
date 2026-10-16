---
type: notetag
title: Conditional Critical Chance by Target State
description: The tags adding bonus crit chance that only applies when the target has a specific state active.
tags: [crit, tag, chance, state]
---

# Conditional Critical Chance by Target State

## Description

Have you ever wanted a skill to crit more reliably — or guaranteed — when the target is already afflicted with a
specific state? Well now you can! By applying the appropriate tags, you can add bonus crit chance that only applies when
the target has a specific state active.

Two families of tags are available, mirroring the [`thisCrit`/`onCrit` split](on-crit-state-application.md):

`thisCritChanceIfState` lives on a specific skill or item and only contributes its bonus when THAT skill is the one
being executed.

`critChanceIfState` lives on any note source attached to the attacker (states, weapons, armors, class, actor, enemy) and
contributes its bonus whenever ANY of their actions is executed against a matching target.

## NOTE ABOUT BONUS CHANCE VALUES

BONUS_CHANCE is a whole-number percent from 0 to 100 (or higher for guaranteed).
A BONUS_CHANCE of 100 effectively guarantees a crit when the state is present, though the target's crit evasion (`cev`)
still applies.

## NOTE ABOUT MULTIPLE TAGS

Multiple tags stack additively. If a skill carries two tags for different states, and the target has both states, both
bonuses are added to the crit chance.

## TAG USAGE

- Skills, for both `<thisCritChanceIfState>` and `<critChanceIfState>`.
- Items, for `<thisCritChanceIfState>`.
- Actors, for `<critChanceIfState>`.
- Classes, for `<critChanceIfState>`.
- Weapons, for `<critChanceIfState>`.
- Armor, for `<critChanceIfState>`.
- Enemies, for `<critChanceIfState>`.
- States, for `<critChanceIfState>`.

## TAG FORMAT

`<thisCritChanceIfState:[STATE_ID, BONUS_CHANCE]>`
`<critChanceIfState:[STATE_ID, BONUS_CHANCE]>`
Where STATE_ID is the id of the state the target must have.
Where BONUS_CHANCE is the percent crit chance bonus (0–100+) to add.

## TAG EXAMPLES

`<thisCritChanceIfState:[14, 100]>`
This skill has guaranteed crit chance against targets afflicted with state 14.

`<thisCritChanceIfState:[14, 50]>`
`<thisCritChanceIfState:[7, 50]>`
This skill gains +50% crit chance if the target has state 14, another +50% if the target has state 7. If both are
present, the bonus totals +100%.

`<critChanceIfState:[14, 30]>`
While this note source is active on the attacker, all of their actions gain +30% crit chance against targets afflicted
with state 14. Useful on passive mastery states to reward building into a specific debuff.