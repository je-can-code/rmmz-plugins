---
type: notetag
title: Apply State on Expire
description: The tag applying a follow-up state when a state expires naturally.
tags: [abs, tag, state, expire, chain]
---

# Apply State on Expire

## Description

When a state expires by its natural frame-counter reaching zero, this tag causes a follow-up state to be applied to the
same battler at a given percent chance. This is the backbone of any "chain" state system.

IMPORTANT: This tag fires ONLY on natural expiry. Forced removal — via dispel, script calls, KO, or the food-chain
strip routine — does NOT trigger it. This distinction is intentional so that removing a chain early does not cascade
the chain forward.

Only one `<applyStateOnExpire>` tag per state is read (the first match). The follow-up state inherits the same source
battler as the expiring state, and the skill that applied it.

The tag is read off the expiring state as the afflicted battler sees it, so a state layered onto it, such as a
`J-Extend` extension state the afflicted battler carries, can change the follow-up it names.

## NOTE ABOUT THE ROLL

The follow-up is rolled the way every state application is, as
[State-Application Immunity & Resistance](../states/state-application-immunity-resistance.md) describes. The battler
that applied the expiring state rolls CHANCE against the afflicted battler: the afflicted battler's State Rate traits
and `<stateTypeResist>` weigh on the chance, and the LUK the source holds over it shapes what remains. The source
brings its own lucky and cursed rolls, joined by the skill's own `<thisLuckyRolls>` and `<thisCursedRolls>` when a
skill applied the expiring state.

No action aims the follow-up, so the follow-up state itself decides how the afflicted battler's curse weighs on the
roll: one carrying `<type:negative>` gets one more chance to land for each curse, and any other has to clear each of
them, as [On-Chance Roll Manipulation](on-chance-roll-manipulation-lucky-cursed-rolls.md) describes. A state the
afflicted battler applied to itself rolls its follow-up as a state it gives itself: its own resistances, no LUK edge,
and its fate counted once. Accumulate Mode and Encore can land the follow-up more than once, and the afflicted
battler's immunities are checked on every landing.

## NOTE ABOUT FOLLOW-UPS IMMUNE TO FATE

A follow-up carrying [`<immuneToFate>`](../states/immune-to-fate.md) rolls once and plainly: CHANCE still meets the
afflicted battler's State Rate traits, `<stateTypeResist>` and, for harm, LUK, but no lucky or cursed rolls,
`<veryLucky>`, `<veryCursed>`, Accumulate Mode or Encore weigh on it, so it lands once at most. A food chain's phases
([`<foodChain:TYPE>`](../../../ext/food/notetags/food-chain-states.md)) carry it, so a chain authored at 100 always
moves on exactly one phase at a time.

## TAG USAGE

- States

## TAG FORMAT

`<applyStateOnExpire:[STATE_ID, CHANCE]>`
Where STATE_ID is the integer database id of the state to apply next.
Where CHANCE is an integer percent chance (0–100) of the follow-up firing.

## TAG EXAMPLES

`<applyStateOnExpire:[STATE_PUMPED_ID, 100]>`
A "Well Fed (Protein)" food chain phase carrying `<foodChain:protein>`, which lands "Pumped" with no roll as it
expires, as the note about food chains above describes.

`<applyStateOnExpire:[STATE_SCORCHED_ID, 50]>`
A "Burning" state that has a 50% chance to leave a "Scorched" debuff.