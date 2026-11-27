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

## NOTE ABOUT THE ROLL

The evader rolls CHANCE against the attacker the way every state application is rolled, as
[State-Application Immunity & Resistance](../states/state-application-immunity-resistance.md) describes: the attacker's
State Rate traits and `<stateTypeResist>` weigh on the chance, and the LUK the evader holds over the attacker shapes
what remains. An evasion is not a skill the evader uses, so the lucky and cursed rolls it brings are its battler-wide
`<luckyRolls>` and `<cursedRolls>` alone.

No action aims the state, so the state itself decides how the attacker's curse weighs on the roll: a state carrying
`<type:negative>` gets one more chance to land for each curse the attacker carries, and any other state has to clear
each of them, as [On-Chance Roll Manipulation](on-chance-roll-manipulation-lucky-cursed-rolls.md) describes. Accumulate
Mode and Encore can land the state more than once, and the attacker's immunities are checked on every landing.

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