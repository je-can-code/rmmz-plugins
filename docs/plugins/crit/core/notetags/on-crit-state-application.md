---
type: notetag
title: On-Crit State Application
description: The tags applying states to the target or to the attacker whenever a critical hit lands.
tags: [crit, tag, state, on-crit, chance]
---

# On-Crit State Application

## Description

Have you ever wanted a critical hit to do more than just deal extra damage? Well now you can! By applying the
appropriate tags to the relevant database objects, you can configure states to be applied to the target or to the
attacker themselves whenever a critical hit lands — each with its own independent chance to trigger.

Two families of tags are available:

`thisCrit` tags live on a specific skill or item and only fire when THAT skill or item lands a critical hit. Think of
these as per-skill effects.

`onCrit` tags live on any note source attached to the attacker (states, weapons, armors, class, actor, enemy) and fire
whenever ANY of their actions lands a critical hit. Think of these as passive crit behaviors — ideal for mastery passive
states that grant a character-wide on-crit effect.

Both families are processed independently on every critical hit, so a battler can carry both simultaneously without
conflict.

## NOTE ABOUT J-ABS

These effects require `J-ABS` to be loaded. The tags will be silently ignored in non-JABS combat contexts.

## NOTE ABOUT CHANCE VALUES

CHANCE is a whole-number percent from 0 to 100: the chance the roll starts from, before the recipient's resistances and,
for a harmful state, the luck between the two battlers weigh in.
Multiple tags for the same state are each rolled independently.

## NOTE ABOUT THE ROLL

Each on-crit state rolls through J-ABS's state application roll, the same roll every state with a chance to land takes,
as [State-Application Immunity & Resistance](../../../abs/core/notetags/states/state-application-immunity-resistance.md)
describes. The CHANCE meets the recipient's State Rate traits and `<stateTypeResist>`, then, for a harmful state, the luck
between the attacker and the recipient, and the result is rolled with both battlers' fate, as
[On-Chance Roll Manipulation](../../../abs/core/notetags/skills/on-chance-roll-manipulation-lucky-cursed-rolls.md)
describes. The skill that landed the critical hit is the skill in hand for that fate.

`Apply` variants are aimed at the target by the skill that crit. A skill targeting the attacker's opponents aims them as
harm, so each curse the target carries is one more chance for the state to land; any other skill aims them as help, so
each curse the target carries is one more hurdle the state has to clear.

`Self` variants are aimed at the attacker by itself. The attacker's own State Rate traits and `<stateTypeResist>` weigh
in, it holds no luck over itself, and its fate counts once.

Accumulate Mode and Encore can land a state more than once, and the recipient's immunities are checked on every landing.

## TAG USAGE

- Skills, for both the `thisCrit` and the `onCrit` tags.
- Items, for the `thisCrit` tags.
- Actors, for the `onCrit` tags.
- Classes, for the `onCrit` tags.
- Weapons, for the `onCrit` tags.
- Armor, for the `onCrit` tags.
- Enemies, for the `onCrit` tags.
- States, for the `onCrit` tags.

## TAG FORMAT

`<thisCritApply:[STATE_ID, CHANCE]>`
`<thisCritSelf:[STATE_ID, CHANCE]>`
`<onCritApply:[STATE_ID, CHANCE]>`
`<onCritSelf:[STATE_ID, CHANCE]>`
Where STATE_ID is the id of the state to apply.
Where CHANCE is the percent chance (0–100) the state's roll starts from on a crit.
`Apply` variants apply the state to the TARGET that was critically hit.
`Self` variants apply the state to the ATTACKER who landed the critical hit.

## TAG EXAMPLES

`<thisCritApply:[5, 30]>`
When this skill crits, it rolls a 30% chance to apply state id 5 to the target.

`<thisCritSelf:[12, 100]>`
When this skill crits, it rolls a 100% chance to apply state id 12 to the attacker, which the attacker's own State Rate
traits and `<stateTypeResist>` can lower.

`<onCritApply:[5, 25]>`
Whenever this battler (or whatever carries this note) lands any critical hit, it rolls a 25% chance to apply state id 5
to the target.
A passive mastery state with this tag would grant the effect for as long as the state is active.

`<onCritSelf:[20, 50]>`
Whenever this battler lands any critical hit, it rolls a 50% chance to apply state id 20 to themselves.