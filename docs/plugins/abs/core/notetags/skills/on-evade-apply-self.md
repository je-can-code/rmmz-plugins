---
type: notetag
title: On Evade Apply Self
description: The tag defining a state a battler may apply to itself when it evades an incoming attack.
tags: [abs, tag, on-chance, evade, state]
---

# On Evade Apply Self

## Description

When this battler evades an incoming attack, they may apply a state to themselves (the one who evaded).

Use this for self-buff effects — rewarding the evader for successfully dodging an attack.

## NOTE ABOUT THE ROLL

The evader rolls CHANCE against itself the way every state application is rolled, as
[State-Application Immunity & Resistance](../states/state-application-immunity-resistance.md) describes: its own State
Rate traits and `<stateTypeResist>` weigh on the chance, and it holds no LUK edge over itself. Its fate counts once, as
the battler making the roll, and an evasion is not a skill it uses, so the lucky and cursed rolls it brings are its
battler-wide `<luckyRolls>` and `<cursedRolls>` alone. Accumulate Mode and Encore can land the state more than once,
and the evader's immunities are checked on every landing.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<onEvadeApplySelf:[STATE_ID, CHANCE]>`
Where STATE_ID is the id of the state to apply to the evader.
Where CHANCE is the integer percent chance to apply it (0-100).

## TAG EXAMPLES

`<onEvadeApplySelf:[6, 50]>`
Applies the state of id 6 to the evader, at a 50 percent chance to apply it.